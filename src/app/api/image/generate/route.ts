import { NextResponse } from 'next/server';

const DEFAULT_PROVIDER = 'stabilityai';
const DEFAULT_MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';

export async function POST(request: Request) {
  const token = process.env.HF_API_KEY;
  const textModel = process.env.HF_IMAGE_MODEL || DEFAULT_MODEL;
  const textProvider = (process.env.HF_PROVIDER || DEFAULT_PROVIDER).trim();
  const textBaseUrl = (process.env.HF_API_URL || `https://router.huggingface.co/${textProvider}/models`).trim();
  const fallbackProvider = (process.env.HF_FALLBACK_PROVIDER || DEFAULT_PROVIDER).trim();
  const fallbackModel = (process.env.HF_FALLBACK_MODEL || DEFAULT_MODEL).trim();
  const imageProvider = (process.env.HF_IMAGE2IMAGE_PROVIDER || DEFAULT_PROVIDER).trim();
  const imageModel = (process.env.HF_IMAGE2IMAGE_MODEL || 'timbrooks/instruct-pix2pix').trim();
  const imageModelCandidates = (
    process.env.HF_IMAGE2IMAGE_MODEL_CANDIDATES ||
    'timbrooks/instruct-pix2pix,stabilityai/stable-diffusion-2-1,runwayml/stable-diffusion-v1-5'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!token) {
    return NextResponse.json({ error: 'HF_API_KEY is missing.' }, { status: 500 });
  }

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
    const negativePrompt =
      'people, faces, hands, animals, scenery, buildings, text, watermarks, logos, food, vehicles, landscapes';

    const callProvider = async (
      providerName: string,
      modelName: string,
      imageBase64?: string,
      providerBaseOverride?: string
    ) => {
      const providerBase =
        providerBaseOverride ?? `https://router.huggingface.co/${providerName}/models`;
      const body = imageBase64
        ? {
            inputs: imageBase64,
            parameters: {
              prompt: constrainedPrompt,
              negative_prompt: negativePrompt,
            },
          }
        : { inputs: constrainedPrompt };
      return fetch(`${providerBase}/${modelName}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-Wait-For-Model': 'true',
        },
        body: JSON.stringify(body),
      });
    };

    const imageDataUri: string | undefined = body?.imageDataUri;
    const imageBase64 =
      imageDataUri && imageDataUri.startsWith('data:')
        ? imageDataUri.substring(imageDataUri.indexOf(',') + 1)
        : undefined;

    const useImageToImage = Boolean(imageBase64);
    const primaryProvider = useImageToImage ? imageProvider : textProvider;
    const primaryModel = useImageToImage ? imageModel : textModel;
    const primaryBaseUrl = useImageToImage ? undefined : textBaseUrl;

    let response: Response | null = null;
    if (useImageToImage) {
      const candidates = [primaryModel, ...imageModelCandidates.filter((m) => m !== primaryModel)];
      for (const candidate of candidates) {
        const candidateResponse = await callProvider(primaryProvider, candidate, imageBase64);
        if (candidateResponse.ok) {
          response = candidateResponse;
          break;
        }
        const errorText = await candidateResponse.text();
        const lowered = errorText.toLowerCase();
        const isModelMissing = candidateResponse.status === 404 || lowered.includes('not found');
        const isTextPipeline =
          lowered.includes('autopipelinefortext2image') || lowered.includes('multiple values');
        if (!isModelMissing && !isTextPipeline) {
          response = candidateResponse;
          break;
        }
      }
      if (!response) {
        return NextResponse.json(
          {
            error:
              'Image editing failed because the image-to-image model is not available on the current provider. Try a different HF_IMAGE2IMAGE_MODEL or switch provider.',
          },
          { status: 404 }
        );
      }
    } else {
      response = await callProvider(primaryProvider, primaryModel, imageBase64, primaryBaseUrl);
    }
    let contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      const errorText = await response.text();
      const lowered = errorText.toLowerCase();
      const needsCredits =
        response.status === 402 ||
        lowered.includes('prepaid') ||
        lowered.includes('credit') ||
        lowered.includes('payment required');

      if (needsCredits && (fallbackProvider !== primaryProvider || fallbackModel !== primaryModel)) {
        response = await callProvider(fallbackProvider, fallbackModel, imageBase64);
        contentType = response.headers.get('content-type') || '';
      } else {
        let friendly = `HF error (${response.status}): ${errorText}`;
        if (needsCredits) {
          friendly =
            'Hugging Face says this provider needs prepaid credits. Please add credits or switch to a free provider/model.';
        } else if (response.status === 401 || lowered.includes('invalid token')) {
          friendly =
            'Hugging Face rejected the token. Please confirm your HF token is valid and has Inference Providers permission.';
        }
        return NextResponse.json({ error: friendly }, { status: response.status });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `HF error (${response.status}): ${errorText}` },
        { status: response.status }
      );
    }

    if (!contentType.startsWith('image/')) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Unexpected HF response: ${errorText}` }, { status: 500 });
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
