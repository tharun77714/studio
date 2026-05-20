import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    // Sanitize phone number (strip whitespace, ensure format)
    phone = phone.trim().replace(/\s+/g, '');

    // Validate phone number format (must be at least 10 digits)
    if (!/^\+?[1-9]\d{9,14}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format. Provide a valid mobile number (e.g., +919876543210).' }, { status: 400 });
    }

    // Generate a secure 6-digit verification code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // Expires in 5 minutes

    const db = await getDb();

    // Upsert verification code into MongoDB 'phone_otps' collection
    await db.collection('phone_otps').updateOne(
      { phone },
      {
        $set: {
          phone,
          otp,
          expires_at: expiresAt,
          attempts: 0,
        }
      },
      { upsert: true }
    );

    // Check for Twilio Credentials
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFromNumber = process.env.TWILIO_FROM_NUMBER;
    const twilioServiceSid = process.env.TWILIO_SERVICE_SID;

    const isTwilioConfigured = twilioAccountSid && twilioAuthToken && (twilioFromNumber || twilioServiceSid);

    if (isTwilioConfigured) {
      // 1. Production Mode: Send actual SMS via Twilio
      try {
        if (twilioServiceSid) {
          // Use Twilio Verify Service if SID is set
          const response = await fetch(`https://verify.twilio.com/v2/Services/${twilioServiceSid}/Verifications`, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: phone,
              Channel: 'sms',
            }),
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Twilio Verify API call failed.');
          }
        } else {
          // Fallback to standard Twilio SMS Message
          const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: twilioFromNumber!,
              To: phone,
              Body: `Your Sparkle Studio verification code is: ${otp}. Valid for 5 minutes.`,
            }),
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Twilio SMS sending failed.');
          }
        }

        return NextResponse.json({ success: true, mode: 'production', message: 'SMS OTP sent successfully via Twilio.' });
      } catch (twilioError: any) {
        console.error('Twilio SMS delivery failed, falling back to mock mode:', twilioError);
        // Fail-safe graceful fallback to local development mock if Twilio credentials fail
        return NextResponse.json({
          success: true,
          mode: 'mock',
          otp,
          message: `SMS failed. Running in developer mock mode. Code: ${otp}`,
        });
      }
    } else {
      // 2. Local Development Mock Mode
      console.log(`[MOCK SMS SERVICE] Sent OTP code: ${otp} to phone number: ${phone}`);
      return NextResponse.json({
        success: true,
        mode: 'mock',
        otp,
        message: `Running in developer mock mode. Code: ${otp}`,
      });
    }

  } catch (error: any) {
    console.error('Phone SMS OTP send handler failed:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred sending the verification code.' }, { status: 500 });
  }
}
