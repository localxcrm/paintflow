import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import { ChatWithMessages } from '@/types/chat';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/chats/[id] - Get chat with messages
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Get chat with related data
    const { data: chat, error: chatError } = await supabase
      .from('Chat')
      .select(`
        *,
        workOrder:WorkOrder (
          id,
          title,
          status,
          jobSite:jobSiteId (
            address,
            city,
            state,
            zip
          )
        ),
        subcontractor:Subcontractor (
          id,
          user:User (
            name,
            phone
          )
        )
      `)
      .eq('id', id)
      .eq('organizationId', organizationId)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Get messages for this chat
    const { data: messages, error: messagesError } = await supabase
      .from('ChatMessage')
      .select('*')
      .eq('chatId', id)
      .order('createdAt', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    // Transform data
    const chatWithMessages: ChatWithMessages = {
      ...chat,
      messages: messages || [],
      workOrder: chat.workOrder ? {
        id: chat.workOrder.id,
        title: chat.workOrder.title,
        status: chat.workOrder.status,
        jobSite: chat.workOrder.jobSite,
      } : undefined,
      subcontractor: chat.subcontractor ? {
        id: chat.subcontractor.id,
        name: chat.subcontractor.user?.name || 'Unknown',
        phone: chat.subcontractor.user?.phone,
      } : undefined,
    };

    return NextResponse.json(chatWithMessages);
  } catch (error) {
    console.error('Error in GET /api/chats/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/chats/[id] - Mark messages as read
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 401 });
    }

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

    // Mark all messages from subcontractor as read
    const { error: updateMessagesError } = await supabase
      .from('ChatMessage')
      .update({ isRead: true })
      .eq('chatId', id)
      .eq('authorType', 'subcontractor')
      .eq('isRead', false);

    if (updateMessagesError) {
      console.error('Error marking messages as read:', updateMessagesError);
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
    }

    // Reset unread count for company
    const { error: updateChatError } = await supabase
      .from('Chat')
      .update({ unreadCountCompany: 0 })
      .eq('id', id);

    if (updateChatError) {
      console.error('Error resetting unread count:', updateChatError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/chats/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
