import { NextResponse } from 'next/server';

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

    let response: Response | null = null;
    let errorText = '';
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        response = await fetch(pollinationsUrl, { cache: 'no-store' });
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.startsWith('image/')) {
            break; // Success
          } else {
            errorText = `Unexpected response content-type: ${contentType}`;
          }
        } else {
          errorText = `Pollinations error (${response.status}): ${await response.text()}`;
        }
      } catch (e: any) {
        errorText = e.message || 'Network error';
      }
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`Retry ${retryCount}/${maxRetries} for image generation...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s before retry
      }
    }

    if (!response || !response.ok) {
      return NextResponse.json(
        { error: errorText || 'Failed to generate image after retries.' },
        { status: response ? response.status : 500 }
      );
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: errorText }, { status: 500 });
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
