import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { getSessionUser, createSession } from '@/lib/session';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser();
    
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const db = await getDb();
    const nowIso = new Date().toISOString();

    if (sessionUser.role === 'individual') {
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
      if (!isValidPhoneNumber(phone)) {
        return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
      }
      const parsedPhone = parsePhoneNumber(phone);
      const normalizedPhone = parsedPhone.number;

      if (normalizedEmail !== sessionUser.email) {
        const existingUser = await db.collection<any>('users').findOne({ email: normalizedEmail, _id: { $ne: sessionUser.id } });
        if (existingUser) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
      }

      const existingProfileWithPhone = await db.collection<any>('profiles').findOne({ individual_phone_number: normalizedPhone, _id: { $ne: sessionUser.id } });
      if (existingProfileWithPhone) return NextResponse.json({ error: 'Phone number already registered.' }, { status: 409 });

      await db.collection<any>('profiles').updateOne({ _id: sessionUser.id }, { $set: { 
        full_name: fullName.trim(), email: normalizedEmail, individual_phone_number: normalizedPhone,
        default_shipping_address_text: defaultShippingAddressText || '',
        default_shipping_address_lat: defaultShippingAddressLat || null,
        default_shipping_address_lng: defaultShippingAddressLng || null,
        profile_completed: true, updated_at: nowIso
      }});

      if (normalizedEmail !== sessionUser.email) {
        await db.collection<any>('users').updateOne({ _id: sessionUser.id }, { $set: { email: normalizedEmail, updated_at: nowIso } });
      }

      await createSession({ id: sessionUser.id, email: normalizedEmail, role: sessionUser.role, profileCompleted: true });
      return NextResponse.json({ success: true });

    } else if (sessionUser.role === 'business') {
      const { 
        businessName, email, gstNumber, businessType, businessAddressText, businessAddressLat, businessAddressLng, contactPersonName, contactPhoneNumber 
      } = body;

      if (!businessName || !email || !gstNumber || !contactPhoneNumber) {
        return NextResponse.json({ error: 'Business Name, Email, GST, and Phone are required.' }, { status: 400 });
      }

      const normalizedEmail = email.trim().toLowerCase();
      if (!isValidPhoneNumber(contactPhoneNumber)) {
        return NextResponse.json({ error: 'Invalid phone number format.' }, { status: 400 });
      }
      const parsedPhone = parsePhoneNumber(contactPhoneNumber);
      const normalizedPhone = parsedPhone.number;

      if (normalizedEmail !== sessionUser.email) {
        const existingUser = await db.collection<any>('users').findOne({ email: normalizedEmail, _id: { $ne: sessionUser.id } });
        if (existingUser) return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
      }

      const existingProfileWithPhone = await db.collection<any>('profiles').findOne({ contact_phone_number: normalizedPhone, _id: { $ne: sessionUser.id } });
      if (existingProfileWithPhone) return NextResponse.json({ error: 'Phone number already registered.' }, { status: 409 });

      await db.collection<any>('profiles').updateOne({ _id: sessionUser.id }, { $set: { 
        business_name: businessName.trim(), email: normalizedEmail, gst_number: gstNumber, business_type: businessType,
        business_address_text: businessAddressText || '', business_address_lat: businessAddressLat || null, business_address_lng: businessAddressLng || null,
        contact_person_name: contactPersonName, contact_phone_number: normalizedPhone,
        profile_completed: true, updated_at: nowIso
      }});

      if (normalizedEmail !== sessionUser.email) {
        await db.collection<any>('users').updateOne({ _id: sessionUser.id }, { $set: { email: normalizedEmail, updated_at: nowIso } });
      }

      // Check if store exists, if not create one
      const existingStore = await db.collection<any>('stores').findOne({ business_id: sessionUser.id });
      if (!existingStore) {
        await db.collection<any>('stores').insertOne({
          business_id: sessionUser.id, name: businessName.trim(), address_text: businessAddressText || '',
          address_lat: businessAddressLat || null, address_lng: businessAddressLng || null,
          created_at: nowIso, updated_at: nowIso
        });
      }

      await createSession({ id: sessionUser.id, email: normalizedEmail, role: sessionUser.role, profileCompleted: true });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });

  } catch (error: any) {
    console.error('Complete Profile error:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred.' }, { status: 500 });
  }
}
