import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { uploadFile } from '@/lib/storage';
import {
  validateFile,
  generateUniqueFilename,
} from '@/lib/upload-utils';

// POST /api/os/upload - Upload file from subcontractor (public OS page)
export async function POST(request: NextRequest) {
  try {
    // Get OS token from header
    const osToken = request.headers.get('x-os-token');
    if (!osToken) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Verify the work order exists and get organizationId
    const { data: workOrder, error: woError } = await supabase
      .from('WorkOrder')
      .select('id, organizationId')
      .eq('publicToken', osToken)
      .single();

    if (woError || !workOrder) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const context = formData.get('context') as string || 'chat';
    const workOrderId = formData.get('workOrderId') as string || workOrder.id;

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

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const filename = generateUniqueFilename(file.name, file.type);

    // Upload to S3/MinIO storage
    const result = await uploadFile(
      buffer,
      file.type,
      workOrder.organizationId,
      context,
      workOrderId,
      filename
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Erro interno ao fazer upload' },
      { status: 500 }
    );
  }
}
