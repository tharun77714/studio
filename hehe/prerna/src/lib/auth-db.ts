import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { createSession } from '@/lib/session';

function nowIso() {
  return new Date().toISOString();
}

export interface BusinessSignUpData {
  businessName: string;
  email: string;
  password: string;
  gstNumber: string;
  businessType: string;
  businessAddressText: string;
  businessAddressLat?: number;
  businessAddressLng?: number;
  contactPersonName: string;
  contactPhoneNumber: string;
}

export interface IndividualSignUpData {
  fullName: string;
  email: string;
  password: string;
  defaultShippingAddressText?: string;
  defaultShippingAddressLat?: number;
  defaultShippingAddressLng?: number;
  individualPhoneNumber: string;
}

export async function createBusinessUser(data: BusinessSignUpData) {
  const db = await getDb();
  const email = data.email.trim().toLowerCase();
  const existingUser = await db.collection<any>('users').findOne({ email });

  if (existingUser) {
    throw new Error('An account with this email already exists.');
  }

  const userId = new ObjectId().toHexString();
  const createdAt = nowIso();
  const passwordHash = await bcrypt.hash(data.password, 12);

  await db.collection<any>('users').insertOne({
    _id: userId,
    email,
    passwordHash,
    role: 'business',
    created_at: createdAt,
    updated_at: createdAt,
  });

  await db.collection<any>('profiles').insertOne({
    _id: userId,
    role: 'business',
    email,
    business_name: data.businessName,
    gst_number: data.gstNumber,
    business_type: data.businessType,
    business_address_text: data.businessAddressText,
    business_address_lat: data.businessAddressLat ?? null,
    business_address_lng: data.businessAddressLng ?? null,
    contact_person_name: data.contactPersonName,
    contact_phone_number: data.contactPhoneNumber,
    created_at: createdAt,
    updated_at: createdAt,
  });

  await db.collection<any>('stores').insertOne({
    business_id: userId,
    name: data.businessName,
    address_text: data.businessAddressText,
    address_lat: data.businessAddressLat ?? null,
    address_lng: data.businessAddressLng ?? null,
    created_at: createdAt,
    updated_at: createdAt,
  });

  return { id: userId, email, role: 'business' as const };
}

export async function createIndividualUser(data: IndividualSignUpData) {
  const db = await getDb();
  const email = data.email.trim().toLowerCase();
  const existingUser = await db.collection<any>('users').findOne({ email });

  if (existingUser) {
    throw new Error('An account with this email already exists.');
  }

  const userId = new ObjectId().toHexString();
  const createdAt = nowIso();
  const passwordHash = await bcrypt.hash(data.password, 12);

  await db.collection<any>('users').insertOne({
    _id: userId,
    email,
    passwordHash,
    role: 'individual',
    created_at: createdAt,
    updated_at: createdAt,
  });

  await db.collection<any>('profiles').insertOne({
    _id: userId,
    role: 'individual',
    email,
    full_name: data.fullName,
    default_shipping_address_text: data.defaultShippingAddressText || '',
    default_shipping_address_lat: data.defaultShippingAddressText ? (data.defaultShippingAddressLat ?? null) : null,
    default_shipping_address_lng: data.defaultShippingAddressText ? (data.defaultShippingAddressLng ?? null) : null,
    individual_phone_number: data.individualPhoneNumber,
    created_at: createdAt,
    updated_at: createdAt,
  });

  return { id: userId, email, role: 'individual' as const };
}

export async function signInUser(emailInput: string, password: string) {
  const db = await getDb();
  const email = emailInput.trim().toLowerCase();
  const user = await db.collection<any>('users').findOne({ email });

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  let passwordMatches = false;

  if (typeof user.passwordHash === 'string' && user.passwordHash.length > 0) {
    passwordMatches = await bcrypt.compare(password, user.passwordHash);
  } else if (typeof user.password === 'string') {
    passwordMatches = user.password === password;
    if (passwordMatches) {
      const newHash = await bcrypt.hash(password, 12);
      await db.collection<any>('users').updateOne(
        { _id: user._id },
        {
          $set: { passwordHash: newHash, updated_at: nowIso() },
          $unset: { password: '' },
        }
      );
    }
  }

  if (!passwordMatches) {
    throw new Error('Invalid email or password.');
  }

  await createSession({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  return { id: user._id, email: user.email, role: user.role };
}

const authDb = {
  createBusinessUser,
  createIndividualUser,
  signInUser,
};

export default authDb;
