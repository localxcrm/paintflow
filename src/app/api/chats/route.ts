import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import { ChatListItem, ChatListResponse } from '@/types/chat';

// GET /api/chats - List all chats for the organization
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Get all chats for the organization with related data
    const { data: chats, error } = await supabase
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
        ),
        subcontractor:Subcontractor (
          id,
          name
        )
      `)
      .eq('organizationId', organizationId)
      .order('lastMessageAt', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
    }

    // Transform data to match ChatListItem interface
    const chatList: ChatListItem[] = (chats || []).map((chat) => ({
      ...chat,
      workOrder: chat.workOrder ? {
        id: chat.workOrder.id,
        title: chat.workOrder.job?.clientName || chat.workOrder.osNumber,
        status: chat.workOrder.status,
        jobSite: chat.workOrder.job ? {
          address: chat.workOrder.job.address,
          city: chat.workOrder.job.city,
          state: chat.workOrder.job.state,
          zip: chat.workOrder.job.zipCode,
        } : undefined,
      } : undefined,
      subcontractor: chat.subcontractor ? {
        id: chat.subcontractor.id,
        name: chat.subcontractor.name || 'Unknown',
      } : undefined,
    }));

    // Calculate total unread count
    const totalUnread = chatList.reduce((sum, chat) => sum + (chat.unreadCountCompany || 0), 0);

    const response: ChatListResponse = {
      chats: chatList,
      totalUnread,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GET /api/chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chats - Create a new chat (typically called when assigning a subcontractor to a work order)
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 401 });
    }

    const body = await request.json();
    const { workOrderId, subcontractorId } = body;

    if (!workOrderId) {
      return NextResponse.json({ error: 'workOrderId is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if chat already exists for this work order
    const { data: existingChat } = await supabase
      .from('Chat')
      .select('id')
      .eq('workOrderId', workOrderId)
      .single();

    if (existingChat) {
      // Chat already exists, return it
      return NextResponse.json({ id: existingChat.id, message: 'Chat already exists' });
    }

    // Create new chat
    const { data: newChat, error } = await supabase
      .from('Chat')
      .insert({
        workOrderId,
        organizationId,
        subcontractorId: subcontractorId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat:', error);
      return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
    }

    return NextResponse.json(newChat, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
