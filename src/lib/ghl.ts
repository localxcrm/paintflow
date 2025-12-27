import { createHmac } from 'crypto';

// GHL SSO Configuration
const GHL_SSO_SECRET = process.env.GHL_SSO_SECRET || '';
const GHL_SSO_EXPIRY_SECONDS = parseInt(process.env.GHL_SSO_EXPIRY_SECONDS || '300', 10);

export interface GhlSsoPayload {
  location_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  timestamp: number;
}

/**
 * Generate payload string from GHL SSO parameters
 */
export function generateGhlPayload(params: GhlSsoPayload): string {
  return `${params.location_id}:${params.user_id}:${params.user_email}:${params.user_name}:${params.timestamp}`;
}

/**
 * Generate HMAC SHA256 signature for GHL SSO
 */
export function generateGhlSignature(payload: string, secret?: string): string {
  const secretKey = secret || GHL_SSO_SECRET;
  if (!secretKey) {
    throw new Error('GHL_SSO_SECRET is not configured');
  }
  return createHmac('sha256', secretKey).update(payload).digest('hex');
}

/**
 * Verify HMAC signature for GHL SSO
 */
export function verifyGhlSignature(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  const expectedSignature = generateGhlSignature(payload, secret);
  // Use timing-safe comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Check if timestamp is valid (not expired)
 */
export function isTimestampValid(
  timestamp: number,
  maxAgeSeconds?: number
): boolean {
  const maxAge = maxAgeSeconds || GHL_SSO_EXPIRY_SECONDS;
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;

  // Timestamp should not be in the future (with 30 second tolerance for clock skew)
  if (age < -30) {
    return false;
  }

  // Timestamp should not be older than max age
  if (age > maxAge) {
    return false;
  }

  return true;
}

/**
 * Generate current timestamp for SSO
 */
export function generateTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Build SSO URL with signature
 */
export function buildGhlSsoUrl(
  baseUrl: string,
  params: Omit<GhlSsoPayload, 'timestamp'>
): string {
  const timestamp = generateTimestamp();
  const payload = generateGhlPayload({ ...params, timestamp });
  const signature = generateGhlSignature(payload);

  const url = new URL('/api/auth/ghl', baseUrl);
  url.searchParams.set('location_id', params.location_id);
  url.searchParams.set('user_id', params.user_id);
  url.searchParams.set('user_email', params.user_email);
  url.searchParams.set('user_name', params.user_name);
  url.searchParams.set('timestamp', timestamp.toString());
  url.searchParams.set('signature', signature);

  return url.toString();
}

/**
 * Validate all GHL SSO parameters
 */
export function validateGhlSsoParams(params: {
  location_id?: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  timestamp?: string;
  signature?: string;
}): { valid: boolean; error?: string; parsed?: GhlSsoPayload & { signature: string } } {
  const { location_id, user_id, user_email, user_name, timestamp, signature } = params;

  // Check required fields
  if (!location_id) {
    return { valid: false, error: 'Missing location_id' };
  }
  if (!user_id) {
    return { valid: false, error: 'Missing user_id' };
  }
  if (!user_email) {
    return { valid: false, error: 'Missing user_email' };
  }
  if (!user_name) {
    return { valid: false, error: 'Missing user_name' };
  }
  if (!timestamp) {
    return { valid: false, error: 'Missing timestamp' };
  }
  if (!signature) {
    return { valid: false, error: 'Missing signature' };
  }

  // Parse timestamp
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) {
    return { valid: false, error: 'Invalid timestamp format' };
  }

  // Check timestamp validity
  if (!isTimestampValid(ts)) {
    return { valid: false, error: 'Timestamp expired or invalid' };
  }

  // Verify signature
  const payload = generateGhlPayload({
    location_id,
    user_id,
    user_email,
    user_name,
    timestamp: ts,
  });

  if (!verifyGhlSignature(payload, signature)) {
    return { valid: false, error: 'Invalid signature' };
  }

  return {
    valid: true,
    parsed: {
      location_id,
      user_id,
      user_email,
      user_name,
      timestamp: ts,
      signature,
    },
  };
}
