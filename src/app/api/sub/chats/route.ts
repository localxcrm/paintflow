import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getSubSessionToken } from '@/lib/auth';
import { ChatListItem, ChatListResponse } from '@/types/chat';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// Helper to get subcontractor from session
async function getSubcontractorFromSession() {
  const sessionToken = await getSubSessionToken();
  if (!sessionToken) return null;

  const supabase = createServerSupabaseClient();

  const { data: session } = await supabase
    .from('Session')
    .select('*, User(*)')
    .eq('token', sessionToken)
    .single();

  if (!session || new Date(session.expiresAt) < new Date()) return null;
  if (session.User.role !== 'subcontractor') return null;

  const { data: subcontractor } = await supabase
    .from('Subcontractor')
    .select('*')
    .eq('userId', session.User.id)
    .single();

  return subcontractor ? { ...subcontractor, user: session.User } : null;
}

// GET /api/sub/chats - List all chats for the subcontractor
export async function GET() {
  try {
    const sub = await getSubcontractorFromSession();
    console.log('[API sub/chats] Subcontractor:', sub?.id, sub?.user?.name);
    if (!sub) {
      console.log('[API sub/chats] No subcontractor session found');
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401, headers: corsHeaders }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get all chats for this subcontractor from the new Chat table
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
        )
      `)
      .eq('subcontractorId', sub.id)
      .order('lastMessageAt', { ascending: false, nullsFirst: false });

    console.log('[API sub/chats] Query for subcontractorId:', sub.id);
    console.log('[API sub/chats] Found chats:', chats?.length || 0);

    if (error) {
      console.error('Error fetching chats:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar conversas' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Transform data to match ChatListItem interface
    const chatList: ChatListItem[] = (chats || []).map((chat: any) => ({
      ...chat,
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
    }));

    // Calculate total unread count (for subcontractor)
    const totalUnread = chatList.reduce((sum: any, chat: any) => sum + (chat.unreadCountSubcontractor || 0), 0);

    const response: ChatListResponse = {
      chats: chatList,
      totalUnread,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in GET /api/sub/chats:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500, headers: corsHeaders }
    );
  }
}
