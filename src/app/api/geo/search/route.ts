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

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '8');
  url.searchParams.set('q', query);

  const response = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }

  const data = (await response.json()) as Array<Record<string, string>>;
  return NextResponse.json({
    suggestions: data.map((item) => ({
      address: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    })),
  });
}
