const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_TEXT_MODEL = process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile';
const DEFAULT_VISION_MODEL = process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

function getApiKey() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Missing GROQ_API_KEY environment variable.');
  }

  return apiKey;
}

type MessageContent =
  | string
  | Array<
      | { type: 'text'; text: string }
      | { type: 'image_url'; image_url: { url: string } }
    >;

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: MessageContent;
}

async function groqRequest(messages: GroqMessage[], model: string, responseFormat?: Record<string, any>) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      response_format: responseFormat,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq request failed (${response.status}): ${text}`);
  }

  return response.json();
}

export async function groqJson<T>(messages: GroqMessage[], schemaName: string): Promise<T> {
  const data = await groqRequest(messages, DEFAULT_TEXT_MODEL, { type: 'json_object' });
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`Groq returned an empty JSON response for ${schemaName}.`);
  }

  return JSON.parse(content) as T;
}

export async function groqText(messages: GroqMessage[], options?: { vision?: boolean }) {
  const data = await groqRequest(messages, options?.vision ? DEFAULT_VISION_MODEL : DEFAULT_TEXT_MODEL);
  const content = data?.choices?.[0]?.message?.content;

  if (!content || typeof content !== 'string') {
    throw new Error('Groq returned an empty text response.');
  }

  return content.trim();
}
