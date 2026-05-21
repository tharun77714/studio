import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser, createSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      fullName, 
      email, 
      phone, 
      defaultShippingAddressText,
      defaultShippingAddressLat,
      defaultShippingAddressLng
    } = body;

    if (!fullName || !email || !phone) {
      return NextResponse.json({ error: 'Full Name, Email, and Phone are required.' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim().replace(/\s+/g, '');

    const db = await getDb();
    
    // Check for email conflicts if they changed their email
    if (normalizedEmail !== sessionUser.email) {
      const existingUser = await db.collection<any>('users').findOne({ 
        email: normalizedEmail,
        _id: { $ne: sessionUser.id }
      });
      if (existingUser) {
        return NextResponse.json({ error: 'This email is already in use by another account.' }, { status: 409 });
      }
    }

    // Check for phone conflicts (another profile might be using this phone)
    const existingProfileWithPhone = await db.collection<any>('profiles').findOne({
      individual_phone_number: normalizedPhone,
      _id: { $ne: sessionUser.id }
    });
    
    if (existingProfileWithPhone) {
      return NextResponse.json({ error: 'This phone number is already registered to another account.' }, { status: 409 });
    }

    const nowIso = new Date().toISOString();

    // Update Profile
    await db.collection<any>('profiles').updateOne(
      { _id: sessionUser.id },
      { 
        $set: { 
          full_name: fullName.trim(),
          email: normalizedEmail,
          individual_phone_number: normalizedPhone,
          default_shipping_address_text: defaultShippingAddressText || '',
          default_shipping_address_lat: defaultShippingAddressLat || null,
          default_shipping_address_lng: defaultShippingAddressLng || null,
          profile_completed: true,
          updated_at: nowIso
        } 
      }
    );

    // Update User (email might have changed)
    if (normalizedEmail !== sessionUser.email) {
      await db.collection<any>('users').updateOne(
        { _id: sessionUser.id },
        { 
          $set: { 
            email: normalizedEmail,
            updated_at: nowIso 
          } 
        }
      );
    }

    // Refresh the session with the updated completed state
    await createSession({
      id: sessionUser.id,
      email: normalizedEmail,
      role: sessionUser.role,
      profileCompleted: true,
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Complete Profile error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
