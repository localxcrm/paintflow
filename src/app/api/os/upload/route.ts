import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// File type configurations
const FILE_CONFIGS = {
  image: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    folder: 'images',
  },
  audio: {
    mimeTypes: ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a'],
    maxSize: 25 * 1024 * 1024, // 25MB
    folder: 'audio',
  },
  video: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxSize: 100 * 1024 * 1024, // 100MB
    folder: 'video',
  },
};

function getFileType(mimeType: string): 'image' | 'audio' | 'video' | null {
  // Get base mime type without codec info (e.g., "audio/webm;codecs=opus" -> "audio/webm")
  const baseMimeType = mimeType.split(';')[0].trim();

  for (const [type, config] of Object.entries(FILE_CONFIGS)) {
    if (config.mimeTypes.includes(baseMimeType)) {
      return type as 'image' | 'audio' | 'video';
    }
  }
  return null;
}

function getExtensionFromMimeType(mimeType: string): string {
  // Get base mime type without codec info
  const baseMimeType = mimeType.split(';')[0].trim();

  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'audio/webm': 'webm',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  };
  return mimeToExt[baseMimeType] || 'bin';
}

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

    // Determine file type
    const fileType = getFileType(file.type);
    if (!fileType) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Use imagens (JPEG, PNG, WebP, GIF), áudio (MP3, M4A, WAV, WebM) ou vídeo (MP4, WebM, MOV).' },
        { status: 400 }
      );
    }

    const config = FILE_CONFIGS[fileType];

    // Validate file size
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / 1024 / 1024;
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo para ${fileType}: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || getExtensionFromMimeType(file.type);
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Build path: org/context/workOrderId/folder/filename
    const path = `${workOrder.organizationId}/${context}/${workOrderId}/${config.folder}/${filename}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json(
        { error: `Erro ao fazer upload: ${error.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
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
