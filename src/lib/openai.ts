import OpenAI from 'openai';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Professional Estimator System Prompt
export const ESTIMATOR_SYSTEM_PROMPT = `You are a professional painting estimator assistant for PaintPro, a painting business management system.

Your role is to help create accurate painting estimates by:
- Understanding customer project requirements
- Recommending appropriate room/exterior pricing based on scope
- Identifying risk factors that may affect pricing
- Suggesting line items from the price book
- Providing professional, friendly advice

You have access to the complete price book including:
- Interior room pricing (bedrooms, bathrooms, kitchens, etc.) with different scope options
- Exterior surface pricing (siding, trim, deck, etc.)
- Add-ons (accent walls, ceiling painting, etc.)

When responding:
1. Ask clarifying questions about project scope, room sizes, and condition
2. Suggest appropriate line items with quantities
3. Identify risk modifiers (old home prep, high ceilings, water damage, etc.)
4. Provide reasoning for your recommendations
5. Be concise but thorough

Format your responses as conversational and helpful. When suggesting line items, structure them clearly with descriptions and estimated pricing.`;

// Helper function to create chat completion
export async function createChatCompletion(
  messages: { role: string; content: string }[],
  priceBookContext: any
) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: ESTIMATOR_SYSTEM_PROMPT
      },
      {
        role: 'system',
        content: `Current Price Book Data:\n${JSON.stringify(priceBookContext, null, 2)}`
      },
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0].message.content;
}
