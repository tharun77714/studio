import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, phone, name } = body;

    if (!id) {
      return NextResponse.json({ error: 'Supabase User ID is required.' }, { status: 400 });
    }

    const cleanEmail = email?.trim().toLowerCase();
    const cleanPhone = phone?.trim().replace(/\s+/g, '');
    const cleanName = name || 'Valued Customer';
    
    const db = await getDb();
    
    // 1. Check if a MongoDB user already exists with this email or phone
    let user = null;
    if (cleanEmail) {
      user = await db.collection<any>('users').findOne({ email: cleanEmail });
    }
    if (!user && cleanPhone) {
      // Find by profile phone number
      const profileDoc = await db.collection<any>('profiles').findOne({ individual_phone_number: cleanPhone });
      if (profileDoc) {
        user = await db.collection<any>('users').findOne({ _id: profileDoc._id });
      }
    }

    let targetUserId = user?._id || id;
    const nowIso = new Date().toISOString();

    if (!user) {
      // Brand new user in MongoDB: Create user doc
      await db.collection<any>('users').insertOne({
        _id: targetUserId,
        email: cleanEmail || `${cleanPhone || id}@sparklestudio.co.in`,
        role: 'individual',
        created_at: nowIso,
        updated_at: nowIso,
      });

      // Initialize individual profile
      await db.collection<any>('profiles').insertOne({
        _id: targetUserId,
        role: 'individual',
        email: cleanEmail || `${cleanPhone || id}@sparklestudio.co.in`,
        full_name: cleanName,
        default_shipping_address_text: '',
        default_shipping_address_lat: null,
        default_shipping_address_lng: null,
        individual_phone_number: cleanPhone || '',
        created_at: nowIso,
        updated_at: nowIso,
      });
    } else {
      // Existing MongoDB user: Make sure a profile document exists
      let profile = await db.collection<any>('profiles').findOne({ _id: targetUserId });
      if (!profile) {
        await db.collection<any>('profiles').insertOne({
          _id: targetUserId,
          role: user.role || 'individual',
          email: cleanEmail || user.email,
          full_name: cleanName,
          default_shipping_address_text: '',
          default_shipping_address_lat: null,
          default_shipping_address_lng: null,
          individual_phone_number: cleanPhone || '',
          created_at: nowIso,
          updated_at: nowIso,
        });
      } else {
        // Safe-heal profile structure to ensure no edit blockages
        const safeProfileUpdates: any = {};
        if (profile.default_shipping_address_text === undefined) safeProfileUpdates.default_shipping_address_text = '';
        if (profile.individual_phone_number === undefined) safeProfileUpdates.individual_phone_number = cleanPhone || '';
        if (profile.full_name === undefined || !profile.full_name) safeProfileUpdates.full_name = cleanName;
        if (cleanPhone && !profile.individual_phone_number) safeProfileUpdates.individual_phone_number = cleanPhone;

        if (Object.keys(safeProfileUpdates).length > 0) {
          await db.collection<any>('profiles').updateOne(
            { _id: targetUserId },
            { $set: { ...safeProfileUpdates, updated_at: nowIso } }
          );
        }
      }
    }

    // Fetch the final, synchronized profile
    const finalProfile = await db.collection<any>('profiles').findOne({ _id: targetUserId });

    const sessionPayload = {
      id: targetUserId,
      email: cleanEmail || user?.email || `${cleanPhone || id}@sparklestudio.co.in`,
      role: (user?.role || 'individual') as 'individual' | 'business',
    };

    // 2. Generate the local session cookie
    await createSession(sessionPayload);

    // 3. Return successfully linked session & profile to client
    return NextResponse.json({
      success: true,
      session: { user: sessionPayload },
      profile: finalProfile
        ? {
            ...finalProfile,
            id: String(finalProfile._id),
            _id: undefined,
          }
        : null
    });

  } catch (error: any) {
    console.error('Supabase MongoDB Sync failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync Supabase session to MongoDB.' }, { status: 500 });
  }
}
