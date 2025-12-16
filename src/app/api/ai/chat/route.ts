import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createChatCompletion, textToSpeech } from '@/lib/openai';

// POST /api/ai/chat - Send a message to AI assistant
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { sessionId, message, isVoiceInput } = body;

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

    // Get price book data, leads, and business settings for context
    const [roomPricesResult, exteriorPricesResult, addonsResult, leadsResult, businessSettingsResult] = await Promise.all([
      supabase.from('RoomPrice').select('*'),
      supabase.from('ExteriorPrice').select('*'),
      supabase.from('Addon').select('*'),
      supabase.from('Lead').select('*').limit(50), // Get recent leads for client lookup
      supabase.from('BusinessSettings').select('*').single(),
    ]);

    if (roomPricesResult.error) throw roomPricesResult.error;
    if (exteriorPricesResult.error) throw exteriorPricesResult.error;
    if (addonsResult.error) throw addonsResult.error;

    const roomPrices = roomPricesResult.data || [];
    const exteriorPrices = exteriorPricesResult.data || [];
    const addons = addonsResult.data || [];
    const leads = leadsResult.data || [];
    const businessSettings = businessSettingsResult.data;

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

    // Fetch conversation history for context
    const { data: previousMessages } = await supabase
      .from('AIMessage')
      .select('role, content')
      .eq('conversationId', conversation.id)
      .order('createdAt', { ascending: true });

    // Build message history for OpenAI (limit to last 10 messages for cost control)
    const messageHistory = (previousMessages || [])
      .slice(-10)
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }));

    // Add current user message
    messageHistory.push({ role: 'user', content: message });

    // Generate AI response using OpenAI with full context
    const aiResponseContent = await createChatCompletion(messageHistory, priceBookContext, {
      availableLeads: leads,
      businessSettings: businessSettings,
    });

    // Parse the AI response to extract estimate details
    const suggestedLineItems = parseEstimateRequest(aiResponseContent || '', priceBookContext);
    const riskModifiers = extractRiskModifiers(aiResponseContent || '');
    const clientInfo = extractClientInfo(aiResponseContent || '', leads);

    // Save AI response
    const { data: aiMessage, error: aiMessageError } = await supabase
      .from('AIMessage')
      .insert({
        conversationId: conversation.id,
        role: 'assistant',
        content: aiResponseContent || 'Sorry, I encountered an error generating a response.',
        suggestedLineItems: JSON.parse(JSON.stringify(suggestedLineItems)),
        suggestedRiskModifiers: riskModifiers,
      })
      .select()
      .single();

    if (aiMessageError) throw aiMessageError;

    // If voice input was used, generate audio response
    let audioUrl;
    if (isVoiceInput && aiResponseContent) {
      // Note: In a production app, you'd want to store the audio file
      // For now, we'll indicate that audio should be generated on the client
      audioUrl = `/api/ai/speak?messageId=${aiMessage.id}`;
    }

    return NextResponse.json({
      message: aiMessage,
      suggestedLineItems,
      suggestedRiskModifiers: riskModifiers,
      suggestedClientInfo: clientInfo,
      audioUrl, // Include audio URL if voice input was used
      isVoiceResponse: !!isVoiceInput,
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

// Helper function to extract client information from AI response
interface ClientInfo {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  leadId?: string;
}

function extractClientInfo(message: string, leads: any[]): ClientInfo {
  const clientInfo: ClientInfo = {};

  // Try to extract name
  const nameMatch = message.match(/(?:Name|Client):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i);
  if (nameMatch) {
    clientInfo.name = nameMatch[1].trim();
  }

  // Try to extract address
  const addressMatch = message.match(/(?:Address|Location):\s*([^,\n]+(?:,\s*[A-Z]{2}\s*\d{5})?)/i);
  if (addressMatch) {
    const fullAddress = addressMatch[1].trim();
    const addressParts = fullAddress.split(',').map(p => p.trim());

    if (addressParts.length >= 1) {
      clientInfo.address = addressParts[0];
    }

    // Try to extract city, state, zip from address
    const cityStateZipMatch = fullAddress.match(/([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5})/);
    if (cityStateZipMatch) {
      clientInfo.city = cityStateZipMatch[1].trim();
      clientInfo.state = cityStateZipMatch[2].trim();
      clientInfo.zipCode = cityStateZipMatch[3].trim();
    }
  }

  // Try to extract phone
  const phoneMatch = message.match(/(?:Phone|Tel|Mobile):\s*([\d\s\-\(\)]+)/i);
  if (phoneMatch) {
    clientInfo.phone = phoneMatch[1].trim();
  }

  // Try to extract email
  const emailMatch = message.match(/(?:Email|E-mail):\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) {
    clientInfo.email = emailMatch[1].trim();
  }

  // Check if AI mentioned a lead by name or ID
  const leadIdMatch = message.match(/(?:lead|client)\s*(?:ID|#):\s*([a-f0-9-]+)/i);
  if (leadIdMatch && leads.some(l => l.id === leadIdMatch[1])) {
    const lead = leads.find(l => l.id === leadIdMatch[1]);
    if (lead) {
      clientInfo.leadId = lead.id;
      clientInfo.name = `${lead.firstName} ${lead.lastName}`;
      clientInfo.address = lead.address;
      clientInfo.city = lead.city;
      clientInfo.state = lead.state;
      clientInfo.zipCode = lead.zipCode;
      clientInfo.phone = lead.phone;
      clientInfo.email = lead.email;
    }
  }

  return clientInfo;
}

