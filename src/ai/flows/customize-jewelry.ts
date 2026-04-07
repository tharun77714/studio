'use server';

import { z } from 'zod';

const CustomizeJewelryInputSchema = z.object({
  customizationDescription: z.string(),
  baseJewelryDataUri: z.string().optional(),
});
export type CustomizeJewelryInput = z.infer<typeof CustomizeJewelryInputSchema>;

const CustomizeJewelryOutputSchema = z.object({
  customizedJewelryDataUri: z.string(),
});
export type CustomizeJewelryOutput = z.infer<typeof CustomizeJewelryOutputSchema>;

export async function customizeJewelry(_input: CustomizeJewelryInput): Promise<CustomizeJewelryOutput> {
  throw new Error('Groq text models are now wired in, but image generation is not supported in this migration yet.');
}
