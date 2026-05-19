"use server";

import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { createSession, getSessionUser } from '@/lib/session';
import type { Profile } from '@/contexts/AuthContext';

function nowIso() {
  return new Date().toISOString();
}

function objectIdToString(value: unknown) {
  return typeof value === 'string' ? value : String(value);
}

function mapProfile(profileDoc: Record<string, any> | null): Profile | null {
  if (!profileDoc) {
    return null;
  }

  return ({
    ...profileDoc,
    id: objectIdToString(profileDoc._id),
    _id: undefined,
  } as unknown) as Profile;
}

function mapMongoDocument<T extends Record<string, any>>(doc: T | null) {
  if (!doc) {
    return null;
  }

  return {
    ...doc,
    id: objectIdToString(doc._id),
    _id: undefined,
  };
}

async function requireAuthenticatedUser() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    throw new Error('You must be signed in to perform this action.');
  }

  return sessionUser;
}

interface BusinessSignUpData {
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

interface IndividualSignUpData {
  fullName: string;
  email: string;
  password: string;
  defaultShippingAddressText?: string;
  defaultShippingAddressLat?: number;
  defaultShippingAddressLng?: number;
  individualPhoneNumber: string;
}

export async function signUpBusiness(data: BusinessSignUpData) {
  const db = await getDb();
  const email = data.email.trim().toLowerCase();
  const existingUser = await db.collection<any>('users').findOne({ email });

  if (existingUser) {
    return { data: null, error: { message: 'An account with this email already exists.' } };
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

  return { data: { user: { id: userId, email, role: 'business' } }, error: null };
}

export async function signUpIndividual(data: IndividualSignUpData) {
  const db = await getDb();
  const email = data.email.trim().toLowerCase();
  const existingUser = await db.collection<any>('users').findOne({ email });

  if (existingUser) {
    return { data: null, error: { message: 'An account with this email already exists.' } };
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

  return { data: { user: { id: userId, email, role: 'individual' } }, error: null };
}

export async function getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
  try {
    const db = await getDb();
    const profile = await db.collection<any>('profiles').findOne({ _id: userId });
    return { data: mapProfile(profile), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getRegisteredBusinesses(): Promise<{ data: Profile[] | null; error: any }> {
  try {
    const db = await getDb();
    const profiles = await db.collection<any>('profiles').find({ role: 'business' }).toArray();
    return { data: profiles.map((profile) => mapProfile(profile)!).filter(Boolean), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

type BusinessProfileUpdateData = Partial<
  Omit<
    Profile,
    | 'id'
    | 'email'
    | 'role'
    | 'full_name'
    | 'default_shipping_address_text'
    | 'default_shipping_address_lat'
    | 'default_shipping_address_lng'
    | 'individual_phone_number'
  >
>;

export async function updateBusinessProfile(userId: string, updates: BusinessProfileUpdateData) {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (sessionUser.id !== userId) {
      return { data: null, error: { message: 'Unauthorized profile update.' } };
    }

    const db = await getDb();
    const updatePayload = {
      ...updates,
      updated_at: nowIso(),
    };

    await db.collection<any>('profiles').updateOne({ _id: userId }, { $set: updatePayload });
    const updated = await db.collection<any>('profiles').findOne({ _id: userId });
    return { data: mapProfile(updated), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

type IndividualProfileUpdateData = Partial<
  Omit<
    Profile,
    | 'id'
    | 'email'
    | 'role'
    | 'business_name'
    | 'gst_number'
    | 'business_type'
    | 'business_address_text'
    | 'business_address_lat'
    | 'business_address_lng'
    | 'contact_person_name'
    | 'contact_phone_number'
  >
>;

export async function updateIndividualProfile(userId: string, updates: IndividualProfileUpdateData) {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (sessionUser.id !== userId) {
      return { data: null, error: { message: 'Unauthorized profile update.' } };
    }

    const db = await getDb();
    await db.collection<any>('profiles').updateOne(
      { _id: userId },
      { $set: { ...updates, updated_at: nowIso() } }
    );

    const updated = await db.collection<any>('profiles').findOne({ _id: userId });
    return { data: mapProfile(updated), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export interface JewelryItemData {
  name: string;
  description: string;
  material: string;
  style: string;
  image_url: string;
  business_id: string;
}

export interface StoreBranchData {
  business_id: string;
  name: string;
  address_text: string;
  address_lat: number;
  address_lng: number;
}

export async function addStoreBranch(branchData: StoreBranchData) {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (sessionUser.id !== branchData.business_id) {
      return { data: null, error: { message: 'Unauthorized branch insertion.' } };
    }

    const db = await getDb();
    const result = await db.collection<any>('stores').insertOne({
      ...branchData,
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    const inserted = await db.collection<any>('stores').findOne({ _id: result.insertedId });
    return { data: mapMongoDocument(inserted), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function addJewelryItem(itemData: JewelryItemData) {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (sessionUser.id !== itemData.business_id) {
      return { data: null, error: { message: 'Unauthorized jewelry insertion.' } };
    }

    const db = await getDb();
    const result = await db.collection<any>('jewelry_items').insertOne({
      ...itemData,
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    const inserted = await db.collection<any>('jewelry_items').findOne({ _id: result.insertedId });
    return { data: inserted ? [mapMongoDocument(inserted)] : [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getJewelryItemsByBusiness(businessId: string) {
  try {
    const db = await getDb();
    const items = await db
      .collection<any>('jewelry_items')
      .find({ business_id: businessId })
      .sort({ created_at: -1 })
      .toArray();

    return { data: items.map((item) => mapMongoDocument(item)), error: null };
  } catch (error) {
    return { data: null, error };
  }
}

interface SaveDesignData {
  user_id: string;
  image_data_uri: string;
  design_prompt: string;
}

export interface SavedDesign {
  id: string;
  user_id: string;
  image_data_uri: string;
  design_prompt: string;
  created_at: string;
}

export async function saveDesignAction(designData: SaveDesignData): Promise<{ data: SavedDesign | null; error: Error | null }> {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (sessionUser.id !== designData.user_id) {
      return { data: null, error: new Error('Unauthorized design save request.') };
    }

    const db = await getDb();
    const payload = { ...designData, created_at: nowIso(), updated_at: nowIso() };
    const result = await db.collection<any>('saved_designs').insertOne(payload);
    const inserted = await db.collection<any>('saved_designs').findOne({ _id: result.insertedId });

    return { data: (mapMongoDocument(inserted) as unknown) as SavedDesign, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Failed to save design.') };
  }
}

export async function getSavedDesignsByUserIdAction(userId: string): Promise<{ data: SavedDesign[] | null; error: Error | null }> {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (sessionUser.id !== userId) {
      return { data: null, error: new Error('Unauthorized saved-design lookup.') };
    }

    const db = await getDb();
    const designs = await db
      .collection<any>('saved_designs')
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();

    return { data: designs.map((design) => mapMongoDocument(design) as SavedDesign), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Failed to fetch saved designs.') };
  }
}

export interface StoreReview {
  id: string;
  store_id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  updated_at?: string;
  reviewer_name?: string;
  reviewer_email?: string;
}

export async function getStoreReviews(storeId: string): Promise<{ data: StoreReview[] | null; error: Error | null }> {
  try {
    const db = await getDb();
    const reviews = await db.collection<any>('store_reviews').find({ store_id: storeId }).sort({ created_at: -1 }).toArray();

    const userIds = [...new Set(reviews.map((review) => review.user_id))];
    const profiles = await db
      .collection<any>('profiles')
      .find({ _id: { $in: userIds } })
      .project({ full_name: 1, email: 1 })
      .toArray();

    const profileMap = new Map(profiles.map((profile) => [objectIdToString(profile._id), profile]));
    const mapped = reviews.map((review) => ({
      ...((mapMongoDocument(review) as unknown) as StoreReview),
      reviewer_name: profileMap.get(review.user_id)?.full_name || 'Anonymous',
      reviewer_email: profileMap.get(review.user_id)?.email || '',
    }));

    return { data: mapped, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Failed to fetch reviews.') };
  }
}

export async function getStoreRating(storeId: string) {
  const { data } = await getStoreReviews(storeId);
  const reviews = data || [];

  if (reviews.length === 0) {
    return { avgRating: 5, reviewCount: 0 };
  }

  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return { avgRating, reviewCount: reviews.length };
}

export async function submitStoreReview(storeId: string, rating: number, reviewText: string) {
  try {
    const sessionUser = await requireAuthenticatedUser();
    const db = await getDb();
    const existing = await db.collection<any>('store_reviews').findOne({
      store_id: storeId,
      user_id: sessionUser.id,
    });

    if (existing) {
      return { error: new Error('You have already reviewed this store.') };
    }

    await db.collection<any>('store_reviews').insertOne({
      store_id: storeId,
      user_id: sessionUser.id,
      rating,
      review_text: reviewText,
      created_at: nowIso(),
      updated_at: nowIso(),
    });

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error('Failed to submit review.') };
  }
}

export async function updateStoreReview(reviewId: string, rating: number, reviewText: string) {
  try {
    const sessionUser = await requireAuthenticatedUser();
    const db = await getDb();
    const review = await db.collection<any>('store_reviews').findOne({ _id: new ObjectId(reviewId) });

    if (!review || review.user_id !== sessionUser.id) {
      return { error: new Error('Unauthorized review update.') };
    }

    await db.collection<any>('store_reviews').updateOne(
      { _id: new ObjectId(reviewId) },
      { $set: { rating, review_text: reviewText, updated_at: nowIso() } }
    );

    return { error: null };
  } catch (error) {
    return { error: error instanceof Error ? error : new Error('Failed to update review.') };
  }
}

export async function hasUserReviewedStore(storeId: string, userId: string) {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (sessionUser.id !== userId) {
      return { data: false, error: new Error('Unauthorized review lookup.') };
    }

    const db = await getDb();
    const review = await db.collection<any>('store_reviews').findOne({ store_id: storeId, user_id: userId });
    return { data: Boolean(review), error: null };
  } catch (error) {
    return { data: false, error: error instanceof Error ? error : new Error('Failed to check review status.') };
  }
}

export async function getBusinessReviews(userId: string) {
  try {
    const sessionUser = await requireAuthenticatedUser();
    if (sessionUser.id !== userId) {
      return { data: null, error: new Error('Unauthorized review lookup.') };
    }

    return getStoreReviews(userId);
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Failed to fetch business reviews.') };
  }
}

export async function signInAndCreateSession(email: string, password: string) {
  const db = await getDb();
  const normalizedEmail = email.trim().toLowerCase();
  const user = await db.collection<any>('users').findOne({
    email: normalizedEmail,
  });

  if (!user) {
    return { error: { message: 'Invalid email or password.' } };
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
          $set: {
            passwordHash: newHash,
            updated_at: nowIso(),
          },
          $unset: {
            password: "",
          },
        }
      );
    }
  }

  if (!passwordMatches) {
    return { error: { message: 'Invalid email or password.' } };
  }

  await createSession({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  return { error: null };
}

export interface FavoriteItemData {
  item_id: string;
  business_id: string;
}

export interface FavoriteItemDetail {
  item_id: string;
  business_id: string;
  business_name?: string;
  name?: string;
  description?: string;
  image_url?: string;
}

export async function toggleFavoriteItem(userId: string, itemId: string, businessId: string) {
  try {
    const db = await getDb();
    const existing = await db.collection<any>('favorites').findOne({ user_id: userId, item_id: itemId });
    if (existing) {
      await db.collection<any>('favorites').deleteOne({ _id: existing._id });
      return { data: false, error: null };
    }
    await db.collection<any>('favorites').insertOne({
      _id: new ObjectId().toHexString(),
      user_id: userId,
      item_id: itemId,
      business_id: businessId,
      created_at: nowIso(),
    });
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Failed to toggle favorite.') };
  }
}

export async function getFavoriteItemIdsByUser(userId: string) {
  try {
    const db = await getDb();
    const favorites = await db.collection<any>('favorites').find({ user_id: userId }).toArray();
    return { data: favorites.map((favorite) => favorite.item_id), error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Failed to fetch favorite IDs.') };
  }
}

export async function getFavoriteItemsByUser(userId: string) {
  try {
    const db = await getDb();
    const favorites = await db.collection<any>('favorites').find({ user_id: userId }).toArray();
    if (favorites.length === 0) {
      return { data: [], error: null };
    }
    const objectItemIds = favorites
      .filter(f => ObjectId.isValid(f.item_id))
      .map(f => new ObjectId(f.item_id));
    const items = await db.collection<any>('jewelry_items').find({ _id: { $in: objectItemIds } }).toArray();
    const profileIds = favorites.map((favorite) => favorite.business_id);
    const profiles = await db.collection<any>('profiles').find({ _id: { $in: profileIds } }).project({ business_name: 1 }).toArray();
    const profileMap = new Map(profiles.map((profile) => [profile._id, profile.business_name]));

    const data = favorites
      .map((favorite) => {
        const item = items.find((entry) => String(entry._id) === favorite.item_id);
        if (!item) return null;
        return {
          item_id: favorite.item_id,
          business_id: favorite.business_id,
          business_name: profileMap.get(favorite.business_id) || undefined,
          name: item.name,
          description: item.description,
          image_url: item.image_url,
        };
      })
      .filter(Boolean) as FavoriteItemDetail[];

    return { data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Failed to fetch favorite items.') };
  }
}
