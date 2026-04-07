'use server';

import { z } from 'zod';
import { groqJson } from '@/lib/groq';

const SuggestJewelryInputSchema = z.object({
  searchQuery: z.string().describe("The user's search query for jewelry."),
});
export type SuggestJewelryInput = z.infer<typeof SuggestJewelryInputSchema>;

const SuggestJewelryOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      type: z.string(),
      style: z.string(),
      material: z.string(),
      description: z.string(),
    })
  ),
});
export type SuggestJewelryOutput = z.infer<typeof SuggestJewelryOutputSchema>;

export async function suggestJewelry(input: SuggestJewelryInput): Promise<SuggestJewelryOutput> {
  return groqJson<SuggestJewelryOutput>(
    [
      {
        role: 'system',
        content:
          'You are an expert jewelry consultant. Return strictly valid JSON with a "suggestions" array of 3 to 5 jewelry recommendations.',
      },
      {
        role: 'user',
        content: `Search query: ${input.searchQuery}\nReturn objects with type, style, material, and description.`,
      },
    ],
    'SuggestJewelryOutput'
  );
}
