import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSubSessionToken } from '@/lib/auth';
import { ChatMessage } from '@/types/chat';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

// GET /api/sub/chats/[id]/messages - Get messages with pagination
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

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

    // Build query
    let query = supabase
      .from('ChatMessage')
      .select('*')
      .eq('chatId', id)
      .order('createdAt', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt('createdAt', cursor);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { error: 'Erro ao buscar mensagens' },
        { status: 500, headers: corsHeaders }
      );
    }

    const hasMore = (messages?.length || 0) > limit;
    const messageList = hasMore ? messages?.slice(0, limit) : messages;
    const nextCursor = hasMore ? messageList?.[messageList.length - 1]?.createdAt : undefined;

    return NextResponse.json({
      messages: (messageList || []).reverse(),
      hasMore,
      nextCursor,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in GET /api/sub/chats/[id]/messages:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST /api/sub/chats/[id]/messages - Send a new message
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sub = await getSubcontractorFromSession();
    if (!sub) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await request.json();
    const { text, type = 'text', mediaUrl, mediaPath, mediaDuration, mediaThumbnail } = body;

    // Validate required fields
    if (type === 'text' && !text?.trim()) {
      return NextResponse.json(
        { error: 'Texto é obrigatório' },
        { status: 400, headers: corsHeaders }
      );
    }
    if (type !== 'text' && !mediaUrl) {
      return NextResponse.json(
        { error: 'URL da mídia é obrigatória' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

    // Verify chat belongs to this subcontractor
    const { data: chat, error: chatError } = await supabase
      .from('Chat')
      .select('id, workOrderId')
      .eq('id', id)
      .eq('subcontractorId', sub.id)
      .single();

    if (chatError || !chat) {
      return NextResponse.json(
        { error: 'Conversa não encontrada' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Create message
    const messageData: Partial<ChatMessage> = {
      chatId: id,
      authorId: sub.userId,
      authorName: sub.user.name || 'Subcontratado',
      authorType: 'subcontractor',
      text: text?.trim() || null,
      type,
      mediaUrl: mediaUrl || null,
      mediaPath: mediaPath || null,
      mediaDuration: mediaDuration || null,
      mediaThumbnail: mediaThumbnail || null,
      isRead: false,
    };

    const { data: message, error: messageError } = await supabase
      .from('ChatMessage')
      .insert(messageData)
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { error: 'Erro ao enviar mensagem' },
        { status: 500, headers: corsHeaders }
      );
    }

    // If it's a media message (image/video), also add to WorkOrder photos
    if ((type === 'image' || type === 'video') && mediaUrl && chat.workOrderId) {
      try {
        const { data: workOrder } = await supabase
          .from('WorkOrder')
          .select('photos')
          .eq('id', chat.workOrderId)
          .single();

        if (workOrder) {
          const newPhoto = {
            id: message.id,
            url: mediaUrl,
            path: mediaPath,
            type: type === 'video' ? 'video' : 'photo',
            caption: 'Enviado via chat pelo subcontratado',
            uploadedAt: new Date().toISOString(),
            uploadedBy: sub.user.name || 'Subcontratado',
          };

          const updatedPhotos = [...(workOrder.photos || []), newPhoto];

          await supabase
            .from('WorkOrder')
            .update({ photos: updatedPhotos })
            .eq('id', chat.workOrderId);
        }
      } catch (syncError) {
        console.error('Error syncing media to work order:', syncError);
      }
    }

    return NextResponse.json(message, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error('Error in POST /api/sub/chats/[id]/messages:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500, headers: corsHeaders }
    );
  }
}
