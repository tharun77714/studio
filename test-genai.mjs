import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: 'A high quality studio photo of a silver ring',
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      }
    });
    console.log("Success! Image bytes length:", response.generatedImages[0].image.imageBytes.length);
  } catch (error) {
    console.error("Error:", error);
  }
}
run();
