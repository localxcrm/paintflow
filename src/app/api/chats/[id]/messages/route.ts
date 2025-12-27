import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import { ChatMessage } from '@/types/chat';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/chats/[id]/messages - Get messages with pagination
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor'); // createdAt for pagination

    const supabase = createServerSupabaseClient();

    // Verify chat belongs to this organization
    const { data: chat, error: chatError } = await supabase
      .from('Chat')
      .select('id')
      .eq('id', id)
      .eq('organizationId', organizationId)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Build query
    let query = supabase
      .from('ChatMessage')
      .select('*')
      .eq('chatId', id)
      .order('createdAt', { ascending: false })
      .limit(limit + 1); // Get one extra to check if there are more

    if (cursor) {
      query = query.lt('createdAt', cursor);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    const hasMore = (messages?.length || 0) > limit;
    const messageList = hasMore ? messages?.slice(0, limit) : messages;
    const nextCursor = hasMore ? messageList?.[messageList.length - 1]?.createdAt : undefined;

    return NextResponse.json({
      messages: (messageList || []).reverse(), // Return in chronological order
      hasMore,
      nextCursor,
    });
  } catch (error) {
    console.error('Error in GET /api/chats/[id]/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chats/[id]/messages - Send a new message
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 401 });
    }

    const body = await request.json();
    const { text, type = 'text', mediaUrl, mediaPath, mediaDuration, mediaThumbnail, authorName } = body;

    // Validate required fields
    if (type === 'text' && !text?.trim()) {
      return NextResponse.json({ error: 'Text is required for text messages' }, { status: 400 });
    }
    if (type !== 'text' && !mediaUrl) {
      return NextResponse.json({ error: 'mediaUrl is required for media messages' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Verify chat belongs to this organization
    const { data: chat, error: chatError } = await supabase
      .from('Chat')
      .select('id, workOrderId')
      .eq('id', id)
      .eq('organizationId', organizationId)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Create message
    const messageData: Partial<ChatMessage> = {
      chatId: id,
      authorName: authorName || 'Admin',
      authorType: 'company',
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
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    // If it's a media message (image/video), also add to WorkOrder photos
    if ((type === 'image' || type === 'video') && mediaUrl && chat.workOrderId) {
      try {
        // Get current work order
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
            caption: 'Enviado via chat',
            uploadedAt: new Date().toISOString(),
            uploadedBy: authorName || 'Admin',
          };

          const updatedPhotos = [...(workOrder.photos || []), newPhoto];

          await supabase
            .from('WorkOrder')
            .update({ photos: updatedPhotos })
            .eq('id', chat.workOrderId);
        }
      } catch (syncError) {
        console.error('Error syncing media to work order:', syncError);
        // Don't fail the message send if sync fails
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/chats/[id]/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
