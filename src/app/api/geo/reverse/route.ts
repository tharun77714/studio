import { NextRequest, NextResponse } from 'next/server';

function getHeaders() {
  return {
    'User-Agent': 'Sparkle Studio/1.0',
    Accept: 'application/json',
  };
}

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get('lat')?.trim();
  const lng = request.nextUrl.searchParams.get('lng')?.trim();

  if (!lat || !lng) {
    return NextResponse.json({ address: '' });
  }

  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lng);

  try {
    const response = await fetch(url, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      return NextResponse.json({ address: '' }, { status: 200 });
    }

    const data = await response.json();
    return NextResponse.json({
      address: data.display_name || '',
    });
  } catch (error) {
    return NextResponse.json({ address: '' }, { status: 200 });
  }
}
