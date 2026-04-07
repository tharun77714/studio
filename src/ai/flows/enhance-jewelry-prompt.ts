'use server';

import { z } from 'zod';
import { groqJson } from '@/lib/groq';

const EnhanceJewelryPromptInputSchema = z.object({
  currentPrompt: z.string(),
});
export type EnhanceJewelryPromptInput = z.infer<typeof EnhanceJewelryPromptInputSchema>;

const EnhanceJewelryPromptOutputSchema = z.object({
  enhancedPrompt: z.string(),
});
export type EnhanceJewelryPromptOutput = z.infer<typeof EnhanceJewelryPromptOutputSchema>;

export async function enhanceJewelryPrompt(input: EnhanceJewelryPromptInput): Promise<EnhanceJewelryPromptOutput> {
  return groqJson<EnhanceJewelryPromptOutput>(
    [
      {
        role: 'system',
        content:
          'You write vivid, commercially useful jewelry-image prompts. Return only valid JSON with one key: "enhancedPrompt".',
      },
      {
        role: 'user',
        content: `Enhance this jewelry design prompt while staying faithful to the original idea:\n${input.currentPrompt}`,
      },
    ],
    'EnhanceJewelryPromptOutput'
  );
}
