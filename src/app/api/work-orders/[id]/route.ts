import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import { sendPushToUser } from '@/lib/push-service';

// GET /api/work-orders/[id] - Get single work order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationIdFromRequest(request);

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { data: workOrder, error } = await supabase
      .from('WorkOrder')
      .select(`
        *,
        job:Job(jobNumber, clientName, address, city, state, zipCode, projectType, subcontractorId, phone, email)
      `)
      .eq('id', id)
      .eq('organizationId', organizationId)
      .single();

    if (error || !workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    return NextResponse.json(workOrder);
  } catch (error) {
    console.error('Error fetching work order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch work order' },
      { status: 500 }
    );
  }
}

// PATCH /api/work-orders/[id] - Update work order
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationIdFromRequest(request);

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const body = await request.json();

    // Fetch existing work order to compare comments
    const { data: existing } = await supabase
      .from('WorkOrder')
      .select('comments, publicToken')
      .eq('id', id)
      .eq('organizationId', organizationId)
      .single();

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Allowed fields to update
    const allowedFields = [
      'status',
      'scheduledDate',
      'estimatedDuration',
      'actualStartDate',
      'actualEndDate',
      'subcontractorPrice',
      'rooms',
      'tasks',
      'materials',
      'photos',
      'comments',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Check if admin is adding a new comment
    if (body.comments && existing?.publicToken) {
      const existingComments = existing.comments || [];
      if (body.comments.length > existingComments.length) {
        const newComment = body.comments[body.comments.length - 1];
        if (newComment.authorType === 'company') {
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

          // Send push to subcontractor (async, don't await)
          sendPushToUser({
            organizationId,
            workOrderToken: existing.publicToken,
            targetUserType: 'subcontractor',
            title: `Nova ${typeLabel} da empresa`,
            message: previewText,
            url: `/os/${existing.publicToken}`,
          });
        }
      }
    }

    const { data: workOrder, error } = await supabase
      .from('WorkOrder')
      .update(updateData)
      .eq('id', id)
      .eq('organizationId', organizationId)
      .select(`
        *,
        job:Job(jobNumber, clientName, address, city, state, zipCode, projectType, subcontractorId)
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

// DELETE /api/work-orders/[id] - Delete work order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organizationId = getOrganizationIdFromRequest(request);

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    const { error } = await supabase
      .from('WorkOrder')
      .delete()
      .eq('id', id)
      .eq('organizationId', organizationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting work order:', error);
    return NextResponse.json(
      { error: 'Failed to delete work order' },
      { status: 500 }
    );
  }
}
