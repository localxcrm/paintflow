import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSubSessionToken } from '@/lib/auth';
import { ChatWithMessages } from '@/types/chat';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Helper to get subcontractor from session
async function getSubcontractorFromSession() {
  const sessionToken = await getSubSessionToken();
  if (!sessionToken) return null;

  const supabase = createServerSupabaseClient();

  // Get session first
  const { data: session } = await supabase
    .from('Session')
    .select('*')
    .eq('token', sessionToken)
    .single();

  if (!session || new Date(session.expiresAt) < new Date()) return null;

  // Get user separately
  const { data: user } = await supabase
    .from('User')
    .select('*')
    .eq('id', session.userId)
    .single();

  if (!user || user.role !== 'subcontractor') return null;

  const { data: subcontractor } = await supabase
    .from('Subcontractor')
    .select('*')
    .eq('userId', user.id)
    .single();

  return subcontractor ? { ...subcontractor, user } : null;
}

// GET /api/sub/chats/[id] - Get chat with messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sub = await getSubcontractorFromSession();
    if (!sub) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get chat with related data (verify it belongs to this subcontractor)
    const { data: chat, error: chatError } = await supabase
      .from('Chat')
      .select(`
        *,
        workOrder:WorkOrder (
          id,
          osNumber,
          status,
          job:Job (
            jobNumber,
            clientName,
            address,
            city,
            state,
            zipCode
          )
        )
      `)
      .eq('id', id)
      .eq('subcontractorId', sub.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Get messages for this chat
    const { data: messages, error: messagesError } = await supabase
      .from('ChatMessage')
      .select('*')
      .eq('chatId', id)
      .order('createdAt', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Erro ao buscar mensagens' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Transform data
    const chatWithMessages: ChatWithMessages = {
      ...chat,
      messages: messages || [],
      workOrder: chat.workOrder ? {
        id: chat.workOrder.id,
        title: chat.workOrder.job?.clientName || `OS #${chat.workOrder.osNumber}`,
        status: chat.workOrder.status,
        jobSite: chat.workOrder.job ? {
          address: chat.workOrder.job.address,
          city: chat.workOrder.job.city,
          state: chat.workOrder.job.state,
          zip: chat.workOrder.job.zipCode,
        } : undefined,
      } : undefined,
      subcontractor: {
        id: sub.id,
        name: sub.user.name,
        phone: sub.user.phone,
      },
    };

    return NextResponse.json(chatWithMessages, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in GET /api/sub/chats/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT /api/sub/chats/[id] - Mark messages as read
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sub = await getSubcontractorFromSession();
    if (!sub) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

    // Verify chat belongs to this subcontractor
    const { data: chat, error: chatError } = await supabase
      .from('Chat')
      .select('id')
      .eq('id', id)
      .eq('subcontractorId', sub.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Mark all messages from company as read
    const { error: updateMessagesError } = await supabase
      .from('ChatMessage')
      .update({ isRead: true })
      .eq('chatId', id)
      .eq('authorType', 'company')
      .eq('isRead', false);

    if (updateMessagesError) {
      console.error('Error marking messages as read:', updateMessagesError);
      return NextResponse.json(
        { error: 'Erro ao marcar mensagens' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Reset unread count for subcontractor
    const { error: updateChatError } = await supabase
      .from('Chat')
      .update({ unreadCountSubcontractor: 0 })
      .eq('id', id);

    if (updateChatError) {
      console.error('Error resetting unread count:', updateChatError);
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in PUT /api/sub/chats/[id]:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500, headers: corsHeaders }
    );
  }
}
