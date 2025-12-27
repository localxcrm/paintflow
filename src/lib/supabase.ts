import { createClient, SupabaseClient } from '@supabase/supabase-js';


// ============================================
// PLAN LIMITS FOR SAAS
// ============================================
export const PLAN_LIMITS = {
  free: {
    users: 1,
    jobsPerMonth: 10,
    storage: '100MB',
    features: ['jobs', 'estimates', 'leads'],
  },
  starter: {
    users: 3,
    jobsPerMonth: 50,
    storage: '1GB',
    features: ['jobs', 'estimates', 'leads', 'calendar', 'map', 'reports'],
  },
  pro: {
    users: 10,
    jobsPerMonth: -1, // unlimited
    storage: '10GB',
    features: ['all'],
  },
  enterprise: {
    users: -1, // unlimited
    jobsPerMonth: -1,
    storage: 'unlimited',
    features: ['all', 'api', 'whitelabel', 'dedicated-support'],
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

// ============================================
// CLIENT-SIDE SUPABASE (SINGLETON)
// ============================================

// Singleton instance to avoid "Multiple GoTrueClient instances" warning
let supabaseInstance: SupabaseClient | null = null;

// Get client-side Supabase client (singleton pattern)
export function getSupabaseClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL and Anon Key are required');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// Export a default instance for convenience (client-side only)
export const supabase: SupabaseClient | null = typeof window !== 'undefined' ? getSupabaseClient() : null;


// ============================================
// CONSTANTS
// ============================================

export const ORG_COOKIE_NAME = 'paintpro_org_id';
export const SESSION_COOKIE_NAME = 'paintpro_session';

// ============================================
// SERVER-SIDE SUPABASE MOVED TO @/lib/supabase-server.ts
// ============================================

// ============================================
// CLIENT-SIDE DIRECT UPLOAD TO SUPABASE STORAGE
// ============================================

interface UploadResult {
  url: string;
  path: string;
  filename: string;
  type: 'image' | 'audio' | 'video';
  mimeType: string;
  size: number;
}

function getFileType(mimeType: string): 'image' | 'audio' | 'video' | null {
  const baseMimeType = mimeType.split(';')[0].trim();
  if (baseMimeType.startsWith('image/')) return 'image';
  if (baseMimeType.startsWith('audio/')) return 'audio';
  if (baseMimeType.startsWith('video/')) return 'video';
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

/**
 * Upload file directly to Supabase Storage from client
 * Bypasses Vercel's 4.5MB serverless function limit
 */
export async function uploadFileDirect(
  file: File | Blob,
  organizationId: string,
  context: string = 'general',
  workOrderId?: string,
  filename?: string
): Promise<UploadResult> {
  const supabase = getSupabaseClient();

  const mimeType = file.type || 'application/octet-stream';
  const fileType = getFileType(mimeType);

  if (!fileType) {
    throw new Error('Tipo de arquivo não suportado');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = filename?.split('.').pop() || getExtensionFromMimeType(mimeType);
  const generatedFilename = `${timestamp}-${randomString}.${extension}`;

  // Build path
  const folder = fileType === 'image' ? 'images' : fileType === 'audio' ? 'audio' : 'video';
  let path = `${organizationId}/${context}`;
  if (workOrderId) {
    path += `/${workOrderId}`;
  }
  path += `/${folder}/${generatedFilename}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(path, file, {
      contentType: mimeType,
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('[DirectUpload] Error:', error);
    throw new Error(`Erro ao fazer upload: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('uploads')
    .getPublicUrl(data.path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    filename: filename || generatedFilename,
    type: fileType,
    mimeType,
    size: file.size,
  };
}

