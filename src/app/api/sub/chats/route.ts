import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

const SUB_SESSION_COOKIE = 'paintpro_sub_session';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SUB_SESSION_COOKIE)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Nao autenticado' },
        { status: 401 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Get session with user
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('*, User(*)')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Sessao invalida' },
        { status: 401 }
      );
    }

    // Get subcontractor linked to this user
    const { data: subcontractor, error: subError } = await supabase
      .from('Subcontractor')
      .select('id, organizationId')
      .eq('userId', session.userId)
      .single();

    if (subError || !subcontractor) {
      return NextResponse.json(
        { error: 'Subcontratado nao encontrado' },
        { status: 404 }
      );
    }

    // Get jobs with their work orders that have comments
    const { data: jobs, error: jobsError } = await supabase
      .from('Job')
      .select(`
        id,
        jobNumber,
        clientName,
        address,
        city,
        scheduledStartDate,
        WorkOrder (
          id,
          osNumber,
          comments,
          status
        )
      `)
      .eq('subcontractorId', subcontractor.id)
      .in('status', ['scheduled', 'got_the_job', 'completed'])
      .order('scheduledStartDate', { ascending: false });

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError);
      return NextResponse.json(
        { error: 'Erro ao buscar conversas' },
        { status: 500 }
      );
    }

    // Transform jobs into chat list format
    const chats = (jobs || [])
      .filter(job => {
        // Only include jobs with work orders that have comments
        const workOrder = job.WorkOrder?.[0];
        if (!workOrder) return false;
        const comments = workOrder.comments as { text?: string; type?: string; createdAt?: string; authorType?: string }[] || [];
        return comments.length > 0;
      })
      .map(job => {
        const workOrder = job.WorkOrder![0];
        const comments = workOrder.comments as { text?: string; type?: string; createdAt?: string; authorType?: string }[] || [];
        const lastComment = comments[comments.length - 1];

        // Extract first name and street number + name
        const firstName = job.clientName?.split(' ')[0] || 'Cliente';

        // Extract number and street from address
        // Formats: "123 Rua das Flores" or "Rua das Flores, 123"
        const addressMatch = job.address?.match(/^(\d+)\s+(.+)$/) ||
                            job.address?.match(/^(.+?),?\s*(\d+)$/);

        let displayAddress = job.address || '';
        if (addressMatch) {
          // Check which group has the number
          const num = addressMatch[1].match(/^\d+$/) ? addressMatch[1] : addressMatch[2];
          const street = addressMatch[1].match(/^\d+$/) ? addressMatch[2] : addressMatch[1];
          displayAddress = `${num} ${street}`;
        }

        // Check for unread messages (from company, after last viewed)
        const hasUnread = comments.some(c => c.authorType === 'company');

        // Format last message preview
        let lastMessagePreview = '';
        if (lastComment) {
          if (lastComment.type === 'text') {
            lastMessagePreview = lastComment.text?.substring(0, 50) || '';
            if ((lastComment.text?.length || 0) > 50) {
              lastMessagePreview += '...';
            }
          } else if (lastComment.type === 'image') {
            lastMessagePreview = 'Foto enviada';
          } else if (lastComment.type === 'video') {
            lastMessagePreview = 'Video enviado';
          } else if (lastComment.type === 'audio') {
            lastMessagePreview = 'Audio enviado';
          }
        }

        return {
          id: workOrder.id,
          jobId: job.id,
          displayName: `${firstName} • ${displayAddress}`,
          clientName: job.clientName,
          address: job.address,
          city: job.city,
          osNumber: workOrder.osNumber,
          lastMessage: lastMessagePreview,
          lastMessageTime: lastComment?.createdAt,
          lastMessageType: lastComment?.type || 'text',
          hasUnread,
          messageCount: comments.length,
        };
      })
      .sort((a, b) => {
        // Sort by last message time, most recent first
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error in sub chats route:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}
