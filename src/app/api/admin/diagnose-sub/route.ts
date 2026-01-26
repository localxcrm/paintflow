import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

// GET /api/admin/diagnose-sub?subId=xxx - Diagnose and fix subcontractor data
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const subId = searchParams.get('subId');

    if (!subId) {
      return NextResponse.json({ error: 'subId required' }, { status: 400 });
    }

    // 1. Get subcontractor details
    const { data: subcontractor, error: subError } = await supabase
      .from('Subcontractor')
      .select('*')
      .eq('id', subId)
      .single();

    if (subError || !subcontractor) {
      return NextResponse.json({ error: 'Subcontractor not found', subError }, { status: 404 });
    }

    // 2. Get all jobs assigned to this subcontractor
    const { data: jobs, error: jobsError } = await supabase
      .from('Job')
      .select('id, jobNumber, clientName, status, subcontractorId')
      .eq('subcontractorId', subId)
      .eq('organizationId', organizationId);

    // 3. Get all WorkOrders for these jobs
    const jobIds = (jobs || []).map((j: { id: string }) => j.id);
    let workOrders: any[] = [];
    if (jobIds.length > 0) {
      const { data: wo, error: woError } = await supabase
        .from('WorkOrder')
        .select('id, osNumber, jobId, status')
        .in('jobId', jobIds);
      workOrders = wo || [];
    }

    // 4. Get all Chats for this subcontractor
    const { data: chats, error: chatsError } = await supabase
      .from('Chat')
      .select('id, workOrderId, subcontractorId')
      .eq('subcontractorId', subId);

    // 5. Find WorkOrders without Chats
    const chatWorkOrderIds = new Set((chats || []).map((c: { workOrderId: string }) => c.workOrderId));
    const workOrdersWithoutChat = workOrders.filter((wo: { id: string }) => !chatWorkOrderIds.has(wo.id));

    return NextResponse.json({
      subcontractor: {
        id: subcontractor.id,
        name: subcontractor.name,
        userId: subcontractor.userId,
      },
      jobs: jobs || [],
      workOrders,
      chats: chats || [],
      issues: {
        workOrdersWithoutChat,
      },
    });
  } catch (error) {
    console.error('Diagnose error:', error);
    return NextResponse.json({ error: 'Failed to diagnose' }, { status: 500 });
  }
}

// POST /api/admin/diagnose-sub - Fix missing chats
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { subId, action } = body;

    if (!subId || action !== 'fix-chats') {
      return NextResponse.json({ error: 'subId and action=fix-chats required' }, { status: 400 });
    }

    // Get all jobs assigned to this subcontractor
    const { data: jobs } = await supabase
      .from('Job')
      .select('id')
      .eq('subcontractorId', subId)
      .eq('organizationId', organizationId);

    const jobIds = (jobs || []).map((j: { id: string }) => j.id);
    if (jobIds.length === 0) {
      return NextResponse.json({ message: 'No jobs found for subcontractor', fixed: 0 });
    }

    // Get WorkOrders for these jobs
    const { data: workOrders } = await supabase
      .from('WorkOrder')
      .select('id, jobId')
      .in('jobId', jobIds);

    if (!workOrders || workOrders.length === 0) {
      return NextResponse.json({ message: 'No work orders found', fixed: 0 });
    }

    // Get existing chats
    const { data: existingChats } = await supabase
      .from('Chat')
      .select('workOrderId')
      .eq('subcontractorId', subId);

    const existingChatWoIds = new Set((existingChats || []).map((c: { workOrderId: string }) => c.workOrderId));

    // Find WorkOrders that need Chat created
    const workOrdersNeedingChat = workOrders.filter((wo: { id: string }) => !existingChatWoIds.has(wo.id));

    if (workOrdersNeedingChat.length === 0) {
      return NextResponse.json({ message: 'All chats already exist', fixed: 0 });
    }

    // Create missing chats
    const chatsToCreate = workOrdersNeedingChat.map((wo: { id: string }) => ({
      workOrderId: wo.id,
      organizationId,
      subcontractorId: subId,
      unreadCountCompany: 0,
      unreadCountSubcontractor: 0,
    }));

    const { error: insertError } = await supabase
      .from('Chat')
      .insert(chatsToCreate);

    if (insertError) {
      console.error('Error creating chats:', insertError);
      return NextResponse.json({ error: 'Failed to create chats', details: insertError }, { status: 500 });
    }

    return NextResponse.json({
      message: `Successfully created ${chatsToCreate.length} chat(s)`,
      fixed: chatsToCreate.length,
      workOrderIds: workOrdersNeedingChat.map((wo: { id: string }) => wo.id),
    });
  } catch (error) {
    console.error('Fix error:', error);
    return NextResponse.json({ error: 'Failed to fix' }, { status: 500 });
  }
}
