'use server';

import { z } from 'zod';
import { groqJson } from '@/lib/groq';

const DescribeJewelryInputSchema = z.object({
  imageDataUri: z.string(),
});
export type DescribeJewelryInput = z.infer<typeof DescribeJewelryInputSchema>;

const DescribeJewelryOutputSchema = z.object({
  description: z.string(),
});
export type DescribeJewelryOutput = z.infer<typeof DescribeJewelryOutputSchema>;

export async function describeJewelry(input: DescribeJewelryInput): Promise<DescribeJewelryOutput> {
  return groqJson<DescribeJewelryOutput>(
    [
      {
        role: 'system',
        content:
          'You are a luxury jewelry copywriter. Return only valid JSON with a single "description" field.',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Describe this jewelry image in one elegant product-style paragraph.' },
          { type: 'image_url', image_url: { url: input.imageDataUri } },
        ],
      },
    ],
    'DescribeJewelryOutput'
  );
}
