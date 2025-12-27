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
    if (!sub) {
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
          title,
          status,
          osNumber,
          jobSite:jobSiteId (
            address,
            city,
            state,
            zip
          )
        )
      `)
      .eq('subcontractorId', sub.id)
      .order('lastMessageAt', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar conversas' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Transform data to match ChatListItem interface
    const chatList: ChatListItem[] = (chats || []).map((chat) => ({
      ...chat,
      workOrder: chat.workOrder ? {
        id: chat.workOrder.id,
        title: chat.workOrder.title || `OS #${chat.workOrder.osNumber}`,
        status: chat.workOrder.status,
        jobSite: chat.workOrder.jobSite,
      } : undefined,
      subcontractor: {
        id: sub.id,
        name: sub.user.name,
        phone: sub.user.phone,
      },
    }));

    // Calculate total unread count (for subcontractor)
    const totalUnread = chatList.reduce((sum, chat) => sum + (chat.unreadCountSubcontractor || 0), 0);

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
