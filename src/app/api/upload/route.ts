import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getOrganizationIdFromRequest } from '@/lib/supabase-server';

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

// POST /api/upload - Upload file to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const organizationId = getOrganizationIdFromRequest(request);
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const context = formData.get('context') as string || 'general'; // 'chat', 'work-order', 'photo'
    const workOrderId = formData.get('workOrderId') as string | null;

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

    // Build path: org/context/[workOrderId]/folder/filename
    let path = `${organizationId}/${context}`;
    if (workOrderId) {
      path += `/${workOrderId}`;
    }
    path += `/${config.folder}/${filename}`;

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

    const supabase = createServerSupabaseClient();

    const { error } = await supabase.storage
      .from('uploads')
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json(
        { error: 'Erro ao deletar arquivo' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Erro interno ao deletar arquivo' },
      { status: 500 }
    );
  }
}
