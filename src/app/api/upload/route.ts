import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';
import { uploadFile, deleteFile } from '@/lib/storage';
import {
  validateFile,
  generateUniqueFilename,
} from '@/lib/upload-utils';

// POST /api/upload - Upload file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    console.log('[Upload API] Starting upload...');
    const supabase = createServerSupabaseClient();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const context = formData.get('context') as string || 'general'; // 'chat', 'work-order', 'photo'
    const workOrderId = formData.get('workOrderId') as string | null;

    console.log('[Upload API] Context:', context, 'WorkOrderId:', workOrderId);

    // Try to get organization ID from cookie first
    let organizationId = getOrganizationIdFromRequest(request);
    console.log('[Upload API] Org ID from cookie:', organizationId);

    // If no org ID and we have a workOrderId, get it from the work order (for subcontractors)
    if (!organizationId && workOrderId) {
      console.log('[Upload API] No org ID, trying to get from work order...');
      const { data: workOrder, error: woError } = await supabase
        .from('WorkOrder')
        .select('organizationId')
        .eq('id', workOrderId)
        .single();

      if (woError) {
        console.log('[Upload API] Error getting work order:', woError);
      }

      if (workOrder?.organizationId) {
        organizationId = workOrder.organizationId;
        console.log('[Upload API] Got org ID from work order:', organizationId);
      }
    }

    if (!organizationId) {
      console.log('[Upload API] No organization ID found, returning error');
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    console.log('[Upload API] Using org ID:', organizationId);

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type and size
    const validation = validateFile(file);
    if (!validation.valid || !validation.fileType) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const fileType = validation.fileType;

    // Generate unique filename
    const filename = generateUniqueFilename(file.name, file.type);

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to S3/MinIO storage
    const result = await uploadFile(
      buffer,
      file.type,
      organizationId,
      context,
      workOrderId || undefined,
      filename
    );

    return NextResponse.json({
      url: result.url,
      path: result.path,
      filename: file.name,
      type: fileType,
      mimeType: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Erro interno ao fazer upload' },
      { status: 500 }
    );
  }
}

// DELETE /api/upload - Delete file from Supabase Storage
export async function DELETE(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Security check: ensure the path belongs to this organization
    if (!path.startsWith(organizationId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await deleteFile(path);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Erro interno ao deletar arquivo' },
      { status: 500 }
    );
  }
}
