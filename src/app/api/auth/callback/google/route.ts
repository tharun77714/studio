import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { createSession } from '@/lib/session';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  // Handle case where user cancelled or Google returned an error
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(new URL(`/auth/individual/signin?error=${encodeURIComponent(error)}`, request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/auth/individual/signin?error=No+authorization+code+provided', request.url));
  }

  try {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth client configuration is missing in environment variables.');
    }

    // Determine the redirect URI dynamically based on the current request host
    const host = request.headers.get('host') || 'localhost:9002';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const redirectUri = `${protocol}://${host}/api/auth/callback/google`;

    // 1. Exchange the auth code for an access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      throw new Error(tokenData.error_description || 'Failed to exchange authorization code.');
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch user information from Google API
    const userinfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userinfo = await userinfoResponse.json();

    if (!userinfoResponse.ok) {
      console.error('Userinfo fetch failed:', userinfo);
      throw new Error('Failed to retrieve user profile from Google.');
    }

    const email = userinfo.email?.trim().toLowerCase();
    const name = userinfo.name || userinfo.given_name || 'Valued Customer';

    if (!email) {
      throw new Error('Google account did not return a valid email address.');
    }

    // 3. Connect to MongoDB and find/create user
    const db = await getDb();
    let user = await db.collection<any>('users').findOne({ email });
    let userId = user?._id;
    let isProfileCompleted = false;

    const nowIso = new Date().toISOString();

    if (!user) {
      // First-time user: Create a new account
      userId = new ObjectId().toHexString();
      await db.collection<any>('users').insertOne({
        _id: userId,
        email,
        role: 'individual', // Default to individual customer
        created_at: nowIso,
        updated_at: nowIso,
      });

      // Initialize individual profile
      await db.collection<any>('profiles').insertOne({
        _id: userId,
        role: 'individual',
        email,
        full_name: name,
        default_shipping_address_text: '',
        default_shipping_address_lat: null,
        default_shipping_address_lng: null,
        individual_phone_number: '',
        profile_completed: false,
        created_at: nowIso,
        updated_at: nowIso,
      });
      isProfileCompleted = false;
    } else {
      // Existing user: Ensure a profile document exists and has all keys safely initialized
      const profile = await db.collection<any>('profiles').findOne({ _id: userId });
      if (!profile) {
        await db.collection<any>('profiles').insertOne({
          _id: userId,
          role: user.role || 'individual',
          email,
          full_name: name,
          default_shipping_address_text: '',
          default_shipping_address_lat: null,
          default_shipping_address_lng: null,
          individual_phone_number: '',
          profile_completed: false,
          created_at: nowIso,
          updated_at: nowIso,
        });
        isProfileCompleted = false;
      } else {
        // Safe-heal profile structure so the user doesn't hit edit blockages
        isProfileCompleted = profile.profile_completed === true;
        const safeProfileUpdates: any = {};
        if (profile.default_shipping_address_text === undefined) safeProfileUpdates.default_shipping_address_text = '';
        if (profile.individual_phone_number === undefined) safeProfileUpdates.individual_phone_number = '';
        if (profile.full_name === undefined || !profile.full_name) safeProfileUpdates.full_name = name;

        if (Object.keys(safeProfileUpdates).length > 0) {
          await db.collection<any>('profiles').updateOne(
            { _id: userId },
            { $set: { ...safeProfileUpdates, updated_at: nowIso } }
          );
        }
      }
    }

    // 4. Create local session
    await createSession({
      id: userId,
      email,
      role: user?.role || 'individual',
      profileCompleted: isProfileCompleted,
    });

    // 5. Redirect to Dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));

  } catch (error: any) {
    console.error('Google OAuth callback handler failed:', error);
    const errorMessage = error.message || 'An unexpected error occurred during Google sign in.';
    return NextResponse.redirect(new URL(`/auth/individual/signin?error=${encodeURIComponent(errorMessage)}`, request.url));
  }
}
