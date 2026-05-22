import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body?.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const constrainedPrompt =
      `Create a high-quality studio product photo of a jewelry item. ` +
      `The subject must be jewelry only (ring, necklace, earrings, bracelet, pendant, brooch, or anklet). ` +
      `No people, faces, animals, scenery, buildings, or text. ` +
      `Use a clean background and product lighting. ` +
      `User request: ${prompt}`;
      
    const seed = Math.floor(Math.random() * 1000000000);
    // Pollinations generates an image just by hitting a URL. It requires no API key!
    const width = 1024;
    const height = 1024;
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(constrainedPrompt)}?width=${width}&height=${height}&seed=${seed}&nologo=true`;

    const response = await fetch(pollinationsUrl);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Generation error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: `Unexpected response content-type: ${contentType}` }, { status: 500 });
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ image: dataUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed.' },
      { status: 500 }
    );
  }
}

