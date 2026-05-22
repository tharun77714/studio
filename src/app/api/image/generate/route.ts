import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allows Vercel to wait up to 60 seconds

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body?.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const constrainedPrompt =
      `A photorealistic, highly detailed studio product shot of jewelry. ` +
      `No people, faces, animals, scenery, buildings, or text. ` +
      `Use a clean background and product lighting. ` +
      `User request: ${prompt}`;

    const passedSeed = body?.seed;
    const seed = passedSeed ? Number(passedSeed) : Math.floor(Math.random() * 1000000000);
    const width = 1024;
    const height = 1024;
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(constrainedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux`;

    const response = await fetch(pollinationsUrl);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Pollinations error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Unexpected response content-type: ${contentType} - ${errorText}` }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = contentType || 'image/jpeg';
    const dataUri = `data:${mimeType};base64,${base64}`;

    return NextResponse.json(
      { dataUri, seed },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
