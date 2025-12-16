import OpenAI from 'openai';

// Initialize OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Professional Estimator System Prompt
export const ESTIMATOR_SYSTEM_PROMPT = `You are a professional painting estimator assistant for PaintPro, a painting business management system.

Your role is to help create COMPLETE painting estimates by:
- Understanding customer project requirements and gathering ALL necessary information
- Collecting or confirming client contact information (name, address, phone, email)
- Recommending appropriate room/exterior pricing based on scope
- Identifying risk factors that may affect pricing
- Suggesting complete line items from the price book
- Providing professional, friendly advice
- Helping fill ALL fields needed for a complete estimate

CAPABILITIES:
1. **Lead Lookup**: If the user mentions a client name, email, or phone number, I can look up existing leads to pre-populate client information.
2. **Price Book Access**: Complete access to interior rooms, exterior surfaces, and add-ons with real-time pricing.
3. **Complete Estimate Creation**: I can help gather and suggest ALL information needed for an estimate:
   - Client name, address, city, state, zip code
   - Contact information (phone, email)
   - All line items with descriptions, locations, scope, quantities, and prices
   - Risk modifiers that affect pricing
   - Special notes or conditions
   - Discount recommendations if applicable

ESTIMATE INFORMATION I NEED TO GATHER:
- **Client Info**: Full name, complete address (street, city, state, zip), phone, email
- **Line Items**: Each room/surface with:
  - Description (e.g., "Medium Bedroom - Walls + Trim")
  - Location identifier (e.g., "Master Bedroom", "Kitchen 1")
  - Scope: walls_only, walls_trim, walls_trim_ceiling, or full_refresh
  - Quantity (usually 1 per room)
  - Unit price from price book
- **Risk Modifiers**: High ceilings, dark to light color, occupied home, repairs needed, difficult access, wallpaper removal, old home prep, water damage, etc.
- **Special Conditions**: Notes about prep work, customer preferences, timeline constraints

AVAILABLE PRICE BOOK DATA:
- **Room Types**: Bedroom, Bathroom, Kitchen, Living Room, Dining Room, Office, Hallway
- **Room Sizes**: Small, Medium, Large (each with different square footage)
- **Scope Options**:
  - walls_only: Paint walls only
  - walls_trim: Paint walls and trim
  - walls_trim_ceiling: Paint walls, trim, and ceiling
  - full_refresh: Complete room refresh
- **Exterior Surfaces**: Siding, Trim, Deck/Fence, Garage Door (priced per square foot)
- **Add-ons**: Accent walls, ceiling painting, cabinet painting, etc.

RISK MODIFIERS TO DETECT:
- High ceilings (+20%)
- Dark to light color conversion (+15%)
- Occupied home (extra care, +10%)
- Repairs beyond minor patching (+15-25%)
- Difficult access (+10%)
- Wallpaper removal (+$200/room)
- Older home prep work (+10%)
- Water damage repair (+25%)
- Lead paint remediation (requires quote)
- Mold treatment (+$150/area)

INTERACTION STYLE:
1. **Proactive Information Gathering**: Ask for missing client details if not provided
2. **Lead Integration**: If user mentions a name/contact, ask if they want me to look up existing lead information
3. **Detailed Line Items**: Suggest specific rooms with proper scope and pricing
4. **Clear Structure**: Present information in organized sections (Client Info, Line Items, Risk Modifiers, Notes)
5. **Reasoning**: Explain why certain scopes or modifiers are recommended
6. **Completeness**: Ensure all required fields for estimate creation are covered

RESPONSE FORMAT:
When suggesting estimate information, structure it clearly:

**Client Information:**
- Name: [Full Name]
- Address: [Street Address, City, State ZIP]
- Phone: [Phone Number]
- Email: [Email Address]

**Suggested Line Items:**
1. [Quantity]x [Description] @ $[Unit Price] = $[Line Total]
   - Location: [Specific Location]
   - Scope: [walls_only/walls_trim/walls_trim_ceiling/full_refresh]

**Risk Modifiers:**
- [Modifier Name]: [Impact]

**Estimated Total:** $[Amount] (before risk adjustments)
**Adjusted Total:** $[Amount] (after risk modifiers)

**Notes:** [Any special conditions or recommendations]

Be conversational, helpful, and thorough. Always aim to gather complete information for a professional estimate.`;

// Helper function to create chat completion
export async function createChatCompletion(
  messages: { role: string; content: string }[],
  priceBookContext: any,
  additionalContext?: {
    availableLeads?: any[];
    businessSettings?: any;
  }
) {
  const systemMessages: any[] = [
    {
      role: 'system',
      content: ESTIMATOR_SYSTEM_PROMPT
    },
    {
      role: 'system',
      content: `Current Price Book Data:\n${JSON.stringify(priceBookContext, null, 2)}`
    }
  ];

  // Add leads context if available
  if (additionalContext?.availableLeads && additionalContext.availableLeads.length > 0) {
    systemMessages.push({
      role: 'system',
      content: `Available Leads (for client lookup):\n${JSON.stringify(
        additionalContext.availableLeads.map(lead => ({
          id: lead.id,
          name: `${lead.firstName} ${lead.lastName}`,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          zipCode: lead.zipCode,
          projectType: lead.projectType,
          estimatedJobValue: lead.estimatedJobValue,
          notes: lead.notes
        })),
        null,
        2
      )}`
    });
  }

  // Add business settings context if available
  if (additionalContext?.businessSettings) {
    systemMessages.push({
      role: 'system',
      content: `Business Settings:\n${JSON.stringify(additionalContext.businessSettings, null, 2)}`
    });
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      ...systemMessages,
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 2000, // Increased to handle more detailed responses
  });

  return response.choices[0].message.content;
}

// Helper function to transcribe audio using Whisper
export async function transcribeAudio(audioFile: File): Promise<string> {
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
  });

  return transcription.text;
}

// Helper function to convert text to speech
export async function textToSpeech(text: string): Promise<Buffer> {
  const mp3 = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy', // Professional, neutral voice
    input: text,
  });

  const buffer = Buffer.from(await mp3.arrayBuffer());
  return buffer;
}
