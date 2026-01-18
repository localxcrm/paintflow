/**
 * Shared file upload validation utilities
 */

export type FileType = 'image' | 'audio' | 'video';

export interface FileConfig {
  mimeTypes: string[];
  maxSize: number;
  folder: string;
}

/**
 * File type configurations with allowed MIME types and size limits
 */
export const FILE_CONFIGS: Record<FileType, FileConfig> = {
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

/**
 * MIME type to file extension mapping
 */
const MIME_TO_EXTENSION: Record<string, string> = {
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

/**
 * Get the base MIME type without codec info
 * e.g., "audio/webm;codecs=opus" -> "audio/webm"
 */
export function getBaseMimeType(mimeType: string): string {
  return mimeType.split(';')[0].trim();
}

/**
 * Determine the file type (image, audio, video) from a MIME type
 *
 * @param mimeType - The MIME type of the file
 * @returns The file type or null if not supported
 */
export function getFileType(mimeType: string): FileType | null {
  const baseMimeType = getBaseMimeType(mimeType);

  for (const [type, config] of Object.entries(FILE_CONFIGS)) {
    if (config.mimeTypes.includes(baseMimeType)) {
      return type as FileType;
    }
  }
  return null;
}

/**
 * Get the file extension from a MIME type
 *
 * @param mimeType - The MIME type of the file
 * @returns The file extension (without dot) or 'bin' if unknown
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const baseMimeType = getBaseMimeType(mimeType);
  return MIME_TO_EXTENSION[baseMimeType] || 'bin';
}

/**
 * Validate a file against the configured limits
 *
 * @param file - The file to validate
 * @returns An object with validation result and error message if invalid
 */
export function validateFile(file: File): {
  valid: boolean;
  fileType: FileType | null;
  error?: string;
} {
  const fileType = getFileType(file.type);

  if (!fileType) {
    return {
      valid: false,
      fileType: null,
      error: 'Tipo de arquivo não suportado. Use imagens (JPEG, PNG, WebP, GIF), áudio (MP3, M4A, WAV, WebM) ou vídeo (MP4, WebM, MOV).',
    };
  }

  const config = FILE_CONFIGS[fileType];

  if (file.size > config.maxSize) {
    const maxSizeMB = config.maxSize / 1024 / 1024;
    return {
      valid: false,
      fileType,
      error: `Arquivo muito grande. Máximo para ${fileType}: ${maxSizeMB}MB`,
    };
  }

  return { valid: true, fileType };
}

/**
 * Generate a unique filename for upload
 *
 * @param originalName - The original filename
 * @param mimeType - The MIME type of the file
 * @returns A unique filename with timestamp and random string
 */
export function generateUniqueFilename(originalName: string, mimeType: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || getExtensionFromMimeType(mimeType);
  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Build the storage path for a file
 *
 * @param organizationId - The organization ID
 * @param context - The upload context (e.g., 'chat', 'work-order')
 * @param fileType - The type of file (image, audio, video)
 * @param filename - The filename
 * @param workOrderId - Optional work order ID for scoping
 * @returns The full storage path
 */
export function buildStoragePath(
  organizationId: string,
  context: string,
  fileType: FileType,
  filename: string,
  workOrderId?: string
): string {
  const config = FILE_CONFIGS[fileType];
  let path = `${organizationId}/${context}`;

  if (workOrderId) {
    path += `/${workOrderId}`;
  }

  path += `/${config.folder}/${filename}`;
  return path;
}
