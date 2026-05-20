import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required.' }, { status: 400 });
    }

    // Sanitize phone number
    phone = phone.trim().replace(/\s+/g, '');

    // Auto-add +91 if it's a 10-digit Indian number
    if (/^\d{10}$/.test(phone)) {
      phone = '+91' + phone;
    }

    // Validate format
    if (!/^\+[1-9]\d{9,14}$/.test(phone)) {
      return NextResponse.json({
        error: 'Invalid phone number. Enter 10 digits (e.g. 9876543210) or full format (+919876543210).',
      }, { status: 400 });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const db = await getDb();

    // Save OTP in MongoDB
    await db.collection('phone_otps').updateOne(
      { phone },
      { $set: { phone, otp, expires_at: expiresAt, attempts: 0 } },
      { upsert: true }
    );

    const fast2smsKey = process.env.FAST2SMS_API_KEY;

    if (fast2smsKey) {
      // Fast2SMS — works for ALL Indian numbers, no trial restrictions
      try {
        // Fast2SMS needs 10-digit number without country code
        const mobileNumber = phone.replace(/^\+91/, '');

        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': fast2smsKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: mobileNumber,
          }),
        });

        const data = await response.json();

        if (!data.return) {
          throw new Error(data.message?.[0] || 'Fast2SMS failed to deliver.');
        }

        return NextResponse.json({
          success: true,
          mode: 'production',
          message: `OTP sent to ${phone}.`,
        });

      } catch (smsError: any) {
        console.error('Fast2SMS error:', smsError.message);
        return NextResponse.json({
          error: `SMS sending failed: ${smsError.message}`,
        }, { status: 500 });
      }
    } else {
      // Development mock — OTP shown in server console
      console.log(`[MOCK SMS] OTP for ${phone}: ${otp}`);
      return NextResponse.json({
        success: true,
        mode: 'mock',
        otp,
        message: `Dev mode: OTP is ${otp}`,
      });
    }

  } catch (error: any) {
    console.error('Phone send error:', error);
    return NextResponse.json({ error: error.message || 'Unexpected error.' }, { status: 500 });
  }
}
