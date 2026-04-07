'use server';

import { z } from 'zod';

const GenerateImageVariationsInputSchema = z.object({
  baseImageDataUri: z.string(),
  originalDescription: z.string(),
});
export type GenerateImageVariationsInput = z.infer<typeof GenerateImageVariationsInputSchema>;

const GenerateImageVariationsOutputSchema = z.object({
  variations: z.array(z.string()).min(0).max(4),
});
export type GenerateImageVariationsOutput = z.infer<typeof GenerateImageVariationsOutputSchema>;

export async function generateImageVariations(_input: GenerateImageVariationsInput): Promise<GenerateImageVariationsOutput> {
  return { variations: [] };
}
