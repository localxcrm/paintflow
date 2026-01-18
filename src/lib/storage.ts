import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ============================================
// S3/MINIO CLIENT CONFIGURATION
// ============================================

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKey = process.env.S3_ACCESS_KEY;
    const secretKey = process.env.S3_SECRET_KEY;
    const region = process.env.S3_REGION || 'us-east-1';

    if (!endpoint || !accessKey || !secretKey) {
      throw new Error('S3 environment variables are not configured');
    }

    s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
      forcePathStyle: true, // Required for MinIO
    });
  }

  return s3Client;
}

const BUCKET = process.env.S3_BUCKET || 'uploads';

// ============================================
// UPLOAD HELPERS
// ============================================

export interface UploadResult {
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
 * Upload file to S3/MinIO storage
 */
export async function uploadFile(
  fileBuffer: Buffer | Uint8Array,
  mimeType: string,
  organizationId: string,
  context: string = 'general',
  workOrderId?: string,
  filename?: string
): Promise<UploadResult> {
  const client = getS3Client();
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

  // Upload to S3/MinIO
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: path,
    Body: fileBuffer,
    ContentType: mimeType,
    CacheControl: 'max-age=3600',
  }));

  // Build public URL
  const endpoint = process.env.S3_ENDPOINT!;
  const url = `${endpoint}/${BUCKET}/${path}`;

  return {
    url,
    path,
    filename: filename || generatedFilename,
    type: fileType,
    mimeType,
    size: fileBuffer.length,
  };
}

/**
 * Get a signed URL for temporary access to a private file
 */
export async function getSignedDownloadUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const client = getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: path,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string): Promise<boolean> {
  const client = getS3Client();

  try {
    await client.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: path,
    }));
    return true;
  } catch (error) {
    console.error('[Storage] Delete error:', error);
    return false;
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  const client = getS3Client();

  try {
    await client.send(new HeadObjectCommand({
      Bucket: BUCKET,
      Key: path,
    }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a signed URL for uploading (client-side direct upload)
 */
export async function getSignedUploadUrl(
  path: string,
  mimeType: string,
  expiresIn: number = 300
): Promise<string> {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: path,
    ContentType: mimeType,
  });

  return getSignedUrl(client, command, { expiresIn });
}
