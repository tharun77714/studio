import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { createSession } from '@/lib/session';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone number and verification code are required.' }, { status: 400 });
    }

    phone = phone.trim().replace(/\s+/g, '');
    code = code.trim();

    const db = await getDb();

    // 1. Retrieve the OTP document from the database
    const otpDoc = await db.collection<any>('phone_otps').findOne({ phone });

    if (!otpDoc) {
      return NextResponse.json({ error: 'No verification request found. Please request a new OTP.' }, { status: 400 });
    }

    // 2. Security Throttle: limit attempts to prevent brute force
    if (otpDoc.attempts >= 5) {
      await db.collection('phone_otps').deleteOne({ phone });
      return NextResponse.json({ error: 'Too many incorrect attempts. Please request a new OTP.' }, { status: 400 });
    }

    // 3. Verify Code match
    if (otpDoc.otp !== code) {
      await db.collection('phone_otps').updateOne(
        { phone },
        { $inc: { attempts: 1 } }
      );
      return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 400 });
    }

    // 4. Verify Expiration
    const now = new Date();
    const expiresAt = new Date(otpDoc.expires_at);
    if (now > expiresAt) {
      await db.collection('phone_otps').deleteOne({ phone });
      return NextResponse.json({ error: 'Verification code has expired. Please request a new OTP.' }, { status: 400 });
    }

    // OTP verified! Delete it so it cannot be reused
    await db.collection('phone_otps').deleteOne({ phone });

    // 5. Query user profile based on individual_phone_number
    let profile = await db.collection<any>('profiles').findOne({ individual_phone_number: phone });
    let userId = profile?._id;
    let email = profile?.email;
    let userDoc = null;

    const nowIso = new Date().toISOString();

    if (profile) {
      // User profile found! Fetch matching user doc
      userDoc = await db.collection<any>('users').findOne({ _id: userId });
      
      if (!userDoc) {
        // Safe-heal missing user record
        email = profile.email || `${phone}@sparklestudio.co.in`;
        await db.collection<any>('users').insertOne({
          _id: userId,
          email,
          role: 'individual',
          created_at: nowIso,
          updated_at: nowIso,
        });
        userDoc = { _id: userId, email, role: 'individual' };
      }
    } else {
      // Profile not found! Let's check if there's a user record with mock phone email as failsafe
      const tempEmail = `${phone}@sparklestudio.co.in`;
      userDoc = await db.collection<any>('users').findOne({ email: tempEmail });

      if (userDoc) {
        userId = userDoc._id;
        email = userDoc.email;
        
        // Recover missing profile
        await db.collection<any>('profiles').insertOne({
          _id: userId,
          role: 'individual',
          email,
          full_name: `Phone Member ${phone.slice(-4)}`,
          default_shipping_address_text: '',
          default_shipping_address_lat: null,
          default_shipping_address_lng: null,
          individual_phone_number: phone,
          profile_completed: false,
          created_at: nowIso,
          updated_at: nowIso,
        });
        profile = await db.collection<any>('profiles').findOne({ _id: userId });
      } else {
        // Brand new user: create users & profiles entry
        userId = new ObjectId().toHexString();
        email = tempEmail;

        await db.collection<any>('users').insertOne({
          _id: userId,
          email,
          role: 'individual',
          created_at: nowIso,
          updated_at: nowIso,
        });

        await db.collection<any>('profiles').insertOne({
          _id: userId,
          role: 'individual',
          email,
          full_name: `Phone Member ${phone.slice(-4)}`,
          default_shipping_address_text: '',
          default_shipping_address_lat: null,
          default_shipping_address_lng: null,
          individual_phone_number: phone,
          profile_completed: false,
          created_at: nowIso,
          updated_at: nowIso,
        });

        profile = await db.collection<any>('profiles').findOne({ _id: userId });
      }
    }

    // Double-check profile fields to guarantee safe edit details
    const safeProfileUpdates: any = {};
    if (profile.default_shipping_address_text === undefined) safeProfileUpdates.default_shipping_address_text = '';
    if (profile.individual_phone_number === undefined) safeProfileUpdates.individual_phone_number = phone;
    if (profile.email === undefined || !profile.email) safeProfileUpdates.email = email;

    if (Object.keys(safeProfileUpdates).length > 0) {
      await db.collection<any>('profiles').updateOne(
        { _id: userId },
        { $set: { ...safeProfileUpdates, updated_at: nowIso } }
      );
      // Reload profile
      profile = await db.collection<any>('profiles').findOne({ _id: userId });
    }

    const sessionPayload = {
      id: userId,
      email: email,
      role: (userDoc?.role || 'individual') as 'individual' | 'business',
      profileCompleted: profile.profile_completed === true,
    };

    // 6. Generate the session cookie
    await createSession(sessionPayload);

    // 7. Return success and prefetched session and profile
    return NextResponse.json({
      success: true,
      session: { user: sessionPayload },
      profile: {
        ...profile,
        id: String(profile._id),
        _id: undefined,
      }
    });

  } catch (error: any) {
    console.error('Phone verification failed:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred verifying code.' }, { status: 500 });
  }
}
