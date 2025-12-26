import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { cookies } from 'next/headers';

const SUB_SESSION_COOKIE = 'paintpro_sub_session';

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
  const baseMimeType = mimeType.split(';')[0].trim();
  for (const [type, config] of Object.entries(FILE_CONFIGS)) {
    if (config.mimeTypes.includes(baseMimeType)) {
      return type as 'image' | 'audio' | 'video';
    }
  }
  return null;
}

function getExtensionFromMimeType(mimeType: string): string {
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

// POST /api/sub/os/upload - Upload file from authenticated subcontractor
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SUB_SESSION_COOKIE)?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Verify session
    const { data: session, error: sessionError } = await supabase
      .from('Session')
      .select('userId')
      .eq('token', sessionToken)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Sessão inválida' }, { status: 401 });
    }

    // Get subcontractor
    const { data: subcontractor, error: subError } = await supabase
      .from('Subcontractor')
      .select('id, organizationId')
      .eq('userId', session.userId)
      .single();

    if (subError || !subcontractor) {
      return NextResponse.json({ error: 'Subcontratado não encontrado' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const context = formData.get('context') as string || 'chat';
    const workOrderId = formData.get('workOrderId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!workOrderId) {
      return NextResponse.json({ error: 'Work order ID required' }, { status: 400 });
    }

    // Verify the work order belongs to a job assigned to this subcontractor
    const { data: workOrder, error: woError } = await supabase
      .from('WorkOrder')
      .select(`
        id,
        organizationId,
        Job!inner (subcontractorId)
      `)
      .eq('id', workOrderId)
      .single();

    if (woError || !workOrder) {
      return NextResponse.json({ error: 'OS não encontrada' }, { status: 404 });
    }

    const jobData = workOrder.Job as { subcontractorId: string } | { subcontractorId: string }[];
    const subcontractorId = Array.isArray(jobData) ? jobData[0]?.subcontractorId : jobData?.subcontractorId;

    if (subcontractorId !== subcontractor.id) {
      return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 403 });
    }

    // Determine file type
    const fileType = getFileType(file.type);
    if (!fileType) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado' },
        { status: 400 }
      );
    }

    const config = FILE_CONFIGS[fileType];

    // Validate file size
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / 1024 / 1024;
      return NextResponse.json(
        { error: `Arquivo muito grande. Máximo: ${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || getExtensionFromMimeType(file.type);
    const filename = `${timestamp}-${randomString}.${extension}`;

    // Build path
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
