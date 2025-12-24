import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sendPushToUser } from '@/lib/push-service';

// GET /api/os/[token] - Get work order by public token (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: workOrder, error } = await supabase
      .from('WorkOrder')
      .select(`
        id,
        osNumber,
        publicToken,
        status,
        scheduledDate,
        estimatedDuration,
        actualStartDate,
        actualEndDate,
        subcontractorPrice,
        rooms,
        tasks,
        materials,
        photos,
        comments,
        createdAt,
        updatedAt,
        organizationId,
        job:Job(jobNumber, clientName, address, city, state, zipCode, projectType)
      `)
      .eq('publicToken', token)
      .single();

    if (error || !workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Fetch organization data for branding
    const { data: organization } = await supabase
      .from('Organization')
      .select('name, logo')
      .eq('id', workOrder.organizationId)
      .single();

    return NextResponse.json({
      ...workOrder,
      organization: organization || null,
    });
  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work order' },
      { status: 500 }
    );
  }
}

// PATCH /api/os/[token] - Update work order from public page (limited fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // First verify the work order exists
    const { data: existing, error: findError } = await supabase
      .from('WorkOrder')
      .select('id, status, tasks, rooms, photos, comments')
      .eq('publicToken', token)
      .single();

    if (findError || !existing) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Build update object - limited to what subcontractor can change
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Subcontractor can update tasks completion
    if (body.tasks) {
      updateData.tasks = body.tasks;
    }

    // Subcontractor can update rooms completion
    if (body.rooms) {
      updateData.rooms = body.rooms;
    }

    // Subcontractor can add photos
    if (body.photos) {
      updateData.photos = body.photos;
    }

    // Subcontractor can add comments
    if (body.comments) {
      updateData.comments = body.comments;

      // Check if there's a new comment to trigger push notification
      const existingComments = existing.comments || [];
      if (body.comments.length > existingComments.length) {
        const newComment = body.comments[body.comments.length - 1];
        if (newComment.authorType === 'subcontractor') {
          // Get work order for organization ID
          const { data: woData } = await supabase
            .from('WorkOrder')
            .select('organizationId, jobId')
            .eq('publicToken', token)
            .single();

          if (woData) {
            const typeLabels: Record<string, string> = {
              text: 'mensagem',
              audio: 'áudio',
              image: 'foto',
              video: 'vídeo',
            };
            const typeLabel = typeLabels[newComment.type] || 'mensagem';
            const previewText = newComment.type === 'text'
              ? newComment.text?.slice(0, 50)
              : `Nova ${typeLabel} recebida`;

            // Send push to admin (async, don't await)
            sendPushToUser({
              organizationId: woData.organizationId,
              workOrderToken: token,
              targetUserType: 'admin',
              title: `Nova ${typeLabel} do subcontratado`,
              message: previewText,
              url: `/jobs/${woData.jobId}`,
            });
          }
        }
      }
    }

    // Auto-update status based on progress
    if (body.tasks || body.rooms) {
      const tasks = body.tasks || existing.tasks;
      const rooms = body.rooms || existing.rooms;

      const allTasksComplete = tasks.every((t: { completed: boolean }) => t.completed);
      const allRoomsComplete = rooms.every((r: { completed: boolean }) => r.completed);

      if (allTasksComplete && allRoomsComplete && existing.status !== 'completed') {
        updateData.status = 'completed';
        updateData.actualEndDate = new Date().toISOString();
      } else if (!allTasksComplete || !allRoomsComplete) {
        if (existing.status === 'sent') {
          updateData.status = 'in_progress';
          updateData.actualStartDate = new Date().toISOString();
        }
      }
    }

    const { data: workOrder, error } = await supabase
      .from('WorkOrder')
      .update(updateData)
      .eq('publicToken', token)
      .select(`
        id,
        osNumber,
        publicToken,
        status,
        scheduledDate,
        estimatedDuration,
        actualStartDate,
        actualEndDate,
        subcontractorPrice,
        rooms,
        tasks,
        materials,
        photos,
        comments,
        createdAt,
        updatedAt,
        job:Job(jobNumber, clientName, address, city, state, zipCode, projectType)
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json(
      { error: 'Failed to update work order' },
      { status: 500 }
    );
  }
}
