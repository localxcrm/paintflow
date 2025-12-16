import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// POST /api/ai/chat - Send a message to AI assistant
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: 'sessionId and message are required' },
        { status: 400 }
      );
    }

    // Get or create conversation
    const { data: existingConversation, error: conversationError } = await supabase
      .from('AIConversation')
      .select('*')
      .eq('sessionId', sessionId)
      .single();

    let conversation;
    if (conversationError && conversationError.code === 'PGRST116') {
      // Conversation doesn't exist, create it
      const { data: newConversation, error: createError } = await supabase
        .from('AIConversation')
        .insert({ sessionId })
        .select()
        .single();

      if (createError) throw createError;
      conversation = newConversation;
    } else if (conversationError) {
      throw conversationError;
    } else {
      conversation = existingConversation;
    }

    // Save user message
    const { error: messageError } = await supabase
      .from('AIMessage')
      .insert({
        conversationId: conversation.id,
        role: 'user',
        content: message,
      });

    if (messageError) throw messageError;

    // Get price book data for context
    const [roomPricesResult, exteriorPricesResult, addonsResult] = await Promise.all([
      supabase.from('RoomPrice').select('*'),
      supabase.from('ExteriorPrice').select('*'),
      supabase.from('Addon').select('*'),
    ]);

    if (roomPricesResult.error) throw roomPricesResult.error;
    if (exteriorPricesResult.error) throw exteriorPricesResult.error;
    if (addonsResult.error) throw addonsResult.error;

    const roomPrices = roomPricesResult.data || [];
    const exteriorPrices = exteriorPricesResult.data || [];
    const addons = addonsResult.data || [];

    // Build context for AI
    const priceBookContext = {
      rooms: roomPrices.map(r => ({
        type: r.roomType,
        size: r.size,
        sqft: r.typicalSqft,
        prices: {
          wallsOnly: r.wallsOnly,
          wallsTrim: r.wallsTrim,
          wallsTrimCeiling: r.wallsTrimCeiling,
          fullRefresh: r.fullRefresh,
        },
      })),
      exterior: exteriorPrices.map(e => ({
        surface: e.surfaceType,
        pricePerSqft: e.pricePerSqft,
        prepMultiplier: e.prepMultiplier,
      })),
      addons: addons.map(a => ({
        name: a.name,
        category: a.category,
        unit: a.unit,
        price: a.basePrice,
      })),
    };

    // Parse the user message to extract estimate details
    const suggestedLineItems = parseEstimateRequest(message, priceBookContext);
    const riskModifiers = extractRiskModifiers(message);

    // Generate AI response
    const aiResponse = generateAIResponse(message, suggestedLineItems, riskModifiers, priceBookContext);

    // Save AI response
    const { data: aiMessage, error: aiMessageError } = await supabase
      .from('AIMessage')
      .insert({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponse.content,
        suggestedLineItems: JSON.parse(JSON.stringify(aiResponse.lineItems)),
        suggestedRiskModifiers: aiResponse.riskModifiers,
      })
      .select()
      .single();

    if (aiMessageError) throw aiMessageError;

    return NextResponse.json({
      message: aiMessage,
      suggestedLineItems: aiResponse.lineItems,
      suggestedRiskModifiers: aiResponse.riskModifiers,
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    return NextResponse.json(
      { error: 'Failed to process AI chat' },
      { status: 500 }
    );
  }
}

// GET /api/ai/chat - Get conversation history
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('AIConversation')
      .select('*')
      .eq('sessionId', sessionId)
      .single();

    if (conversationError && conversationError.code === 'PGRST116') {
      // Conversation doesn't exist
      return NextResponse.json({ messages: [] });
    } else if (conversationError) {
      throw conversationError;
    }

    // Get messages for this conversation
    const { data: messages, error: messagesError } = await supabase
      .from('AIMessage')
      .select('*')
      .eq('conversationId', conversation.id)
      .order('createdAt', { ascending: true });

    if (messagesError) throw messagesError;

    return NextResponse.json({ ...conversation, messages: messages || [] });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    );
  }
}

// Helper function to parse estimate requests
interface PriceBookContext {
  rooms: Array<{
    type: string;
    size: string;
    sqft: number;
    prices: {
      wallsOnly: number;
      wallsTrim: number;
      wallsTrimCeiling: number;
      fullRefresh: number;
    };
  }>;
  exterior: Array<{
    surface: string;
    pricePerSqft: number;
    prepMultiplier: number;
  }>;
  addons: Array<{
    name: string;
    category: string;
    unit: string;
    price: number;
  }>;
}

interface SuggestedLineItem {
  description: string;
  location: string;
  scope: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

function parseEstimateRequest(message: string, priceBook: PriceBookContext): SuggestedLineItem[] {
  const items: SuggestedLineItem[] = [];
  const lowerMessage = message.toLowerCase();

  // Room type patterns
  const roomPatterns = [
    { regex: /(\d+)\s*(?:bed(?:room)?s?)/gi, type: 'Bedroom' },
    { regex: /(\d+)\s*(?:bath(?:room)?s?)/gi, type: 'Bathroom' },
    { regex: /(\d+)\s*(?:kitchen)/gi, type: 'Kitchen' },
    { regex: /(\d+)\s*(?:living\s*room)/gi, type: 'Living Room' },
    { regex: /(\d+)\s*(?:dining\s*room)/gi, type: 'Dining Room' },
    { regex: /(\d+)\s*(?:office)/gi, type: 'Office' },
    { regex: /(\d+)\s*(?:hallway)/gi, type: 'Hallway' },
  ];

  // Detect size
  let size = 'medium';
  if (lowerMessage.includes('small')) size = 'small';
  if (lowerMessage.includes('large')) size = 'large';

  // Detect scope
  let scope = 'walls_trim';
  if (lowerMessage.includes('walls only') || lowerMessage.includes('just walls')) {
    scope = 'walls_only';
  } else if (lowerMessage.includes('ceiling') || lowerMessage.includes('full refresh')) {
    scope = 'walls_trim_ceiling';
  } else if (lowerMessage.includes('full') || lowerMessage.includes('everything')) {
    scope = 'full_refresh';
  }

  // Extract rooms
  for (const pattern of roomPatterns) {
    const matches = lowerMessage.matchAll(pattern.regex);
    for (const match of matches) {
      const quantity = parseInt(match[1]);

      // Find matching price in price book
      const priceEntry = priceBook.rooms.find(
        r => r.type.toLowerCase() === pattern.type.toLowerCase() &&
             r.size.toLowerCase() === size
      );

      if (priceEntry) {
        let unitPrice = priceEntry.prices.wallsTrim;
        if (scope === 'walls_only') unitPrice = priceEntry.prices.wallsOnly;
        if (scope === 'walls_trim_ceiling') unitPrice = priceEntry.prices.wallsTrimCeiling;
        if (scope === 'full_refresh') unitPrice = priceEntry.prices.fullRefresh;

        items.push({
          description: `${size.charAt(0).toUpperCase() + size.slice(1)} ${pattern.type} - ${scope.replace(/_/g, ' ')}`,
          location: pattern.type,
          scope,
          quantity,
          unitPrice,
          lineTotal: quantity * unitPrice,
        });
      }
    }
  }

  return items;
}

// Helper function to extract risk modifiers
function extractRiskModifiers(message: string): string[] {
  const modifiers: string[] = [];
  const lowerMessage = message.toLowerCase();

  const riskPatterns = [
    { pattern: /old(?:er)?\s*(?:home|house)/i, modifier: 'Older home (+10% prep)' },
    { pattern: /(?:heavy\s*)?prep\s*(?:work)?|lots?\s*of\s*prep/i, modifier: 'Heavy prep work (+15%)' },
    { pattern: /high\s*(?:ceiling|vault)/i, modifier: 'High ceilings (+20%)' },
    { pattern: /(?:water\s*)?damage/i, modifier: 'Water damage repair (+25%)' },
    { pattern: /wallpaper\s*(?:removal)?/i, modifier: 'Wallpaper removal (+$200/room)' },
    { pattern: /texture|textured/i, modifier: 'Textured walls (+10%)' },
    { pattern: /dark\s*(?:color|paint)/i, modifier: 'Dark color coverage (+15%)' },
    { pattern: /lead\s*(?:paint)?/i, modifier: 'Lead paint remediation (quote)' },
    { pattern: /mold|mildew/i, modifier: 'Mold treatment (+$150/area)' },
  ];

  for (const { pattern, modifier } of riskPatterns) {
    if (pattern.test(lowerMessage)) {
      modifiers.push(modifier);
    }
  }

  return modifiers;
}

// Generate AI response
function generateAIResponse(
  message: string,
  lineItems: SuggestedLineItem[],
  riskModifiers: string[],
  priceBook: PriceBookContext
): { content: string; lineItems: SuggestedLineItem[]; riskModifiers: string[] } {
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

  // Calculate risk modifier impact
  let riskMultiplier = 1;
  for (const modifier of riskModifiers) {
    if (modifier.includes('+10%')) riskMultiplier += 0.1;
    if (modifier.includes('+15%')) riskMultiplier += 0.15;
    if (modifier.includes('+20%')) riskMultiplier += 0.2;
    if (modifier.includes('+25%')) riskMultiplier += 0.25;
  }

  const adjustedTotal = subtotal * riskMultiplier;

  let content = '';

  if (lineItems.length > 0) {
    content = `Based on your description, I found the following in your price book:\n\n`;
    content += `📋 **Suggested Line Items:**\n`;

    for (const item of lineItems) {
      content += `• ${item.quantity}x ${item.description} @ $${item.unitPrice.toFixed(2)} = $${item.lineTotal.toFixed(2)}\n`;
    }

    content += `\n**Subtotal:** $${subtotal.toFixed(2)}\n`;

    if (riskModifiers.length > 0) {
      content += `\n⚠️ **Risk Modifiers Detected:**\n`;
      for (const modifier of riskModifiers) {
        content += `• ${modifier}\n`;
      }
      content += `\n**Adjusted Total:** $${adjustedTotal.toFixed(2)}\n`;
    }

    content += `\nWould you like me to apply these to your estimate?`;
  } else {
    content = `I couldn't find specific room matches in your price book. Could you provide more details about:\n`;
    content += `• Number and type of rooms (e.g., "3 bedrooms, 2 bathrooms")\n`;
    content += `• Room sizes (small, medium, large)\n`;
    content += `• Scope of work (walls only, walls and trim, full refresh)\n\n`;
    content += `Your price book includes: ${priceBook.rooms.map(r => r.type).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`;
  }

  return { content, lineItems, riskModifiers };
}
