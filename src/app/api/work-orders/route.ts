import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import { randomBytes } from 'crypto';
import { DEFAULT_PAINTING_TASKS } from '@/types/work-order';

// Generate unique tokens
function generatePublicToken(): string {
  return randomBytes(16).toString('hex');
}

function generateOsNumber(existingCount: number): string {
  const year = new Date().getFullYear();
  const number = (existingCount + 1).toString().padStart(4, '0');
  return `OS-${year}-${number}`;
}

// GET /api/work-orders - List all work orders
export async function GET(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');

    let query = supabase
      .from('WorkOrder')
      .select(`
        *,
        job:Job(jobNumber, clientName, address, city, state, zipCode, projectType, subcontractorId)
      `)
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (jobId) {
      query = query.eq('jobId', jobId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: workOrders, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ workOrders: workOrders || [] });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    );
  }
}

// POST /api/work-orders - Create a new work order
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    if (!body.jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Get job data
    const { data: job, error: jobError } = await supabase
      .from('Job')
      .select('id, jobNumber, clientName, subcontractorPrice, scheduledStartDate')
      .eq('id', body.jobId)
      .eq('organizationId', organizationId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Count existing work orders for OS number
    const { count } = await supabase
      .from('WorkOrder')
      .select('*', { count: 'exact', head: true })
      .eq('organizationId', organizationId);

    // Create default tasks with unique IDs
    const defaultTasks = DEFAULT_PAINTING_TASKS.map((task, index) => ({
      ...task,
      id: `task-${Date.now()}-${index}`,
    }));

    const { data: workOrder, error } = await supabase
      .from('WorkOrder')
      .insert({
        organizationId,
        jobId: body.jobId,
        osNumber: generateOsNumber(count || 0),
        publicToken: generatePublicToken(),
        status: 'draft',
        scheduledDate: body.scheduledDate || job.scheduledStartDate,
        estimatedDuration: body.estimatedDuration || 8,
        subcontractorPrice: body.subcontractorPrice || job.subcontractorPrice || 0,
        rooms: body.rooms || [],
        tasks: body.tasks || defaultTasks,
        materials: body.materials || [],
        photos: [],
        comments: [],
      })
      .select(`
        *,
        job:Job(jobNumber, clientName, address, city, state, zipCode, projectType, subcontractorId)
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json(
      { error: 'Failed to create work order' },
      { status: 500 }
    );
  }
}
