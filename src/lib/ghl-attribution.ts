/**
 * GHL Attribution Helper
 *
 * Extracts attribution data from GoHighLevel webhook payloads
 * and maps sources to PaintFlow marketing channels.
 */

export interface Attribution {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  referrer: string | null;
  landingPage: string | null;
  sessionSource: string | null;
  gclid: string | null;
  fbclid: string | null;
  gaClientId: string | null;
}

export interface ClientInfo {
  clientName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  fullAddress: string | null;
  jobValue: number;
  projectType: 'interior' | 'exterior' | 'both';
}

/**
 * Extract attribution data from GHL webhook payload
 */
export function extractAttribution(payload: Record<string, unknown>): Attribution {
  const attribution = (payload.attribution || {}) as Record<string, unknown>;

  return {
    utmSource: (attribution.utmSource || payload.utmSource || null) as string | null,
    utmMedium: (attribution.utmMedium || payload.medium || null) as string | null,
    utmCampaign: (attribution.utmCampaign || payload.utmCampaign || null) as string | null,
    utmContent: (attribution.utmContent || payload.utmContent || null) as string | null,
    utmTerm: (attribution.utmTerm || attribution.utmKeyword || payload.utmKeyword || null) as string | null,
    referrer: (attribution.referrer || payload.referrer || null) as string | null,
    landingPage: (attribution.url || payload.url || null) as string | null,
    sessionSource: (attribution.sessionSource || payload.sessionSource || null) as string | null,
    gclid: (attribution.gclid || payload.gclid || null) as string | null,
    fbclid: (payload.fbp || attribution.fbp || null) as string | null,
    gaClientId: (attribution.gaClientId || payload.gaClientId || null) as string | null,
  };
}

/**
 * Extract client information from GHL webhook payload
 */
export function extractClientInfo(payload: Record<string, unknown>): ClientInfo {
  // Extract name
  const fullName = payload.full_name || payload.name || '';
  const firstName = payload.first_name || payload.firstName || '';
  const lastName = payload.last_name || payload.lastName || '';
  const clientName = (fullName || `${firstName} ${lastName}`.trim() || 'Cliente GHL') as string;

  // Extract address
  const address = (payload.address1 || payload.address || '') as string;
  const city = (payload.city || '') as string;
  const state = (payload.state || payload.country || '') as string;
  const fullAddress = (payload.full_address ||
    (address && city ? `${address}, ${city} ${state}`.trim() : null)) as string | null;

  // Extract job value from various fields
  const customData = (payload.customData || {}) as Record<string, unknown>;
  const jobValueRaw =
    customData.value ||
    payload['[Estimate] Total Price'] ||
    payload['[Estimate] Sub-total'] ||
    payload['Services Sold - Enter the value below:'] ||
    payload.monetary_value ||
    payload.opportunity_value ||
    '0';
  const jobValue = parseFloat(String(jobValueRaw).replace(/[^0-9.-]/g, '')) || 0;

  // Extract project type
  const serviceType = (payload['Form | Which Service'] as string)?.toLowerCase() || '';
  let projectType: 'interior' | 'exterior' | 'both' = 'interior';
  if (serviceType.includes('exterior')) {
    projectType = serviceType.includes('interior') ? 'both' : 'exterior';
  } else if (serviceType.includes('both')) {
    projectType = 'both';
  }

  return {
    clientName,
    email: (payload.email || null) as string | null,
    phone: (payload.phone || null) as string | null,
    address,
    city,
    state,
    fullAddress,
    jobValue,
    projectType,
  };
}

/**
 * Map GHL session source to PaintFlow marketing channel ID
 *
 * PaintFlow channels (from settings):
 * - google: Google Ads
 * - facebook: Facebook/Instagram
 * - referral: Indicação
 * - yard_sign: Placa de Obra
 * - door_knock: Door Knock
 * - repeat: Cliente Repetido
 * - site: Site/SEO
 * - other: Outros
 */
export function mapSourceToChannel(
  sessionSource: string | null,
  medium: string | null,
  referrer: string | null,
  utmSource: string | null
): string {
  const source = (sessionSource || '').toLowerCase();
  const med = (medium || '').toLowerCase();
  const ref = (referrer || '').toLowerCase();
  const utm = (utmSource || '').toLowerCase();

  // Google Ads (paid search)
  if (
    source.includes('google') ||
    utm.includes('google') ||
    med === 'cpc' ||
    med === 'ppc' ||
    ref.includes('google') && med === 'paid'
  ) {
    return 'google';
  }

  // Facebook/Instagram (Meta)
  if (
    source.includes('facebook') ||
    source.includes('instagram') ||
    source.includes('meta') ||
    utm.includes('facebook') ||
    utm.includes('instagram') ||
    utm.includes('meta') ||
    ref.includes('facebook') ||
    ref.includes('instagram')
  ) {
    return 'facebook';
  }

  // Referral/Indicação
  if (
    source === 'referral' ||
    med === 'referral' ||
    utm === 'referral' ||
    source.includes('indica')
  ) {
    return 'referral';
  }

  // Direct/Organic/Site
  if (
    source === 'direct' ||
    source === 'organic' ||
    med === 'organic' ||
    med === 'calendar' ||
    source.includes('seo')
  ) {
    return 'site';
  }

  // If we have a referrer but no clear source, it's likely organic/site
  if (ref && !source) {
    return 'site';
  }

  // Default to other
  return 'other';
}

/**
 * Get the Monday of the week containing the given date
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  // Adjust to Monday (day 1). If Sunday (0), go back 6 days
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/**
 * Extract GHL location ID from webhook payload
 * Checks multiple possible locations for the ID
 */
export function extractLocationId(payload: Record<string, unknown>): string | null {
  // Check root level 'id' (most common from n8n)
  if (payload.id && typeof payload.id === 'string' && payload.id.length > 10) {
    return payload.id;
  }

  // Check nested location.id
  const location = payload.location as Record<string, unknown> | undefined;
  if (location?.id) {
    return location.id as string;
  }

  // Check locationId directly
  if (payload.locationId) {
    return payload.locationId as string;
  }

  // Check location_id (snake_case)
  if (payload.location_id) {
    return payload.location_id as string;
  }

  return null;
}

/**
 * Extract GHL contact ID from webhook payload
 */
export function extractContactId(payload: Record<string, unknown>): string | null {
  // Check contact.id
  const contact = payload.contact as Record<string, unknown> | undefined;
  if (contact?.id) {
    return contact.id as string;
  }

  // Check contactId directly
  if (payload.contactId) {
    return payload.contactId as string;
  }

  // Check contact_id (snake_case)
  if (payload.contact_id) {
    return payload.contact_id as string;
  }

  // Use email as fallback identifier
  if (payload.email) {
    return `email:${payload.email}`;
  }

  return null;
}
