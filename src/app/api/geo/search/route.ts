import { NextRequest, NextResponse } from 'next/server';

function getHeaders() {
  return {
    'User-Agent': 'Sparkle Studio/1.0',
    Accept: 'application/json',
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json({ suggestions: [] });
  }

  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('limit', '8');
  url.searchParams.set('q', query);

  const response = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }

  const data = await response.json();
  const features = data.features || [];

  return NextResponse.json({
    suggestions: features.map((feature: any) => {
      const p = feature.properties;
      const addressParts = [p.name, p.street, p.city, p.state, p.country].filter(Boolean);
      // Remove duplicates from address parts (e.g. name might be same as city)
      const uniqueAddressParts = Array.from(new Set(addressParts));
      
      return {
        address: uniqueAddressParts.join(', '),
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        pincode: p.postcode || '',
      };
    }),
  });
}
