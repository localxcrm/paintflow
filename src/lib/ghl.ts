// GoHighLevel Integration Utilities
import { supabaseAdmin } from './supabase';
import type {
  GhlConnection,
  GhlLead,
  GhlLeadInsert,
  GhlLeadUpdate,
  GhlEventRawInsert,
  GhlWebhookPayload,
  GhlContactPayload,
  GhlOpportunityPayload,
  GhlPipeline,
  GhlLeadStatus,
} from '@/types/database';

// ============================================
// GHL API CLIENT
// ============================================

const GHL_API_BASE = 'https://services.leadconnectorhq.com';

interface GhlApiOptions {
  method?: string;
  body?: unknown;
}

export async function ghlApiRequest(
  connection: GhlConnection,
  endpoint: string,
  options: GhlApiOptions = {}
): Promise<unknown> {
  const { method = 'GET', body } = options;

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${connection.accessToken || connection.apiKey}`,
    'Version': '2021-07-28',
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${GHL_API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GHL API error: ${response.status} - ${error}`);
  }

  return response.json();
}

// ============================================
// CONNECTION MANAGEMENT
// ============================================

export async function getConnectionByLocationId(
  locationId: string
): Promise<GhlConnection | null> {
  const { data, error } = await supabaseAdmin
    .from('GhlConnection')
    .select('*')
    .eq('locationId', locationId)
    .eq('isActive', true)
    .single();

  if (error || !data) {
    return null;
  }

  return data as GhlConnection;
}

export async function getConnectionsByTenant(
  tenantId: string
): Promise<GhlConnection[]> {
  const { data, error } = await supabaseAdmin
    .from('GhlConnection')
    .select('*')
    .eq('tenantId', tenantId)
    .eq('isActive', true);

  if (error) {
    console.error('Error fetching GHL connections:', error);
    return [];
  }

  return (data || []) as GhlConnection[];
}

export async function testConnection(
  apiKey: string,
  locationId: string
): Promise<{ success: boolean; error?: string; locationName?: string }> {
  try {
    const response = await fetch(`${GHL_API_BASE}/locations/${locationId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Version': '2021-07-28',
      },
    });

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json() as { location?: { name?: string } };
    return {
      success: true,
      locationName: data.location?.name || 'Unknown Location',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// PIPELINE MANAGEMENT
// ============================================

export async function getPipelines(connection: GhlConnection): Promise<GhlPipeline[]> {
  try {
    const response = await ghlApiRequest(
      connection,
      `/opportunities/pipelines?locationId=${connection.locationId}`
    ) as { pipelines?: GhlPipeline[] };

    return response.pipelines || [];
  } catch (error) {
    console.error('Error fetching pipelines:', error);
    return [];
  }
}

// ============================================
// WEBHOOK PROCESSING
// ============================================

export async function saveRawEvent(
  connectionId: string,
  tenantId: string,
  locationId: string,
  eventType: string,
  payload: Record<string, unknown>
): Promise<string | null> {
  const eventData: GhlEventRawInsert = {
    connectionId,
    tenantId,
    locationId,
    eventType,
    eventId: (payload.id as string) || null,
    payload,
    processedAt: null,
    processingError: null,
    retryCount: 0,
  };

  const { data, error } = await supabaseAdmin
    .from('GhlEventRaw')
    .insert(eventData)
    .select('id')
    .single();

  if (error) {
    console.error('Error saving raw event:', error);
    return null;
  }

  return data.id;
}

export async function markEventProcessed(
  eventId: string,
  error?: string
): Promise<void> {
  const updateData: Record<string, unknown> = {
    processedAt: new Date().toISOString(),
  };

  if (error) {
    updateData.processingError = error;
  }

  await supabaseAdmin
    .from('GhlEventRaw')
    .update(updateData)
    .eq('id', eventId);
}

// ============================================
// LEAD STATUS MAPPING
// ============================================

export function mapStageToStatus(
  stageId: string,
  stageMapping: GhlConnection['stageMapping']
): GhlLeadStatus {
  if (stageId === stageMapping.won_stage_id) {
    return 'won';
  }
  if (stageId === stageMapping.lost_stage_id) {
    return 'lost';
  }
  if (stageId === stageMapping.estimate_stage_id) {
    return 'estimate_sent';
  }

  // Default progression
  return 'new';
}

// ============================================
// CONTACT/LEAD PROCESSING
// ============================================

export async function processContactEvent(
  connection: GhlConnection,
  contact: GhlContactPayload,
  eventId?: string
): Promise<GhlLead | null> {
  try {
    // Check if lead already exists
    const { data: existingLead } = await supabaseAdmin
      .from('GhlLead')
      .select('*')
      .eq('tenantId', connection.tenantId)
      .eq('ghlContactId', contact.id)
      .single();

    const leadData: GhlLeadInsert | GhlLeadUpdate = {
      tenantId: connection.tenantId,
      connectionId: connection.id,
      workspaceId: connection.workspaceId,
      ghlContactId: contact.id,
      firstName: contact.firstName || null,
      lastName: contact.lastName || null,
      fullName: contact.name || `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || null,
      email: contact.email || null,
      phone: contact.phone || null,
      address: contact.address1 || null,
      city: contact.city || null,
      state: contact.state || null,
      zipCode: contact.postalCode || null,
      source: contact.source || null,
      tags: contact.tags || [],
      customFields: contact.customFields ? Object.fromEntries(
        (contact.customFields as Array<{ key: string; value: unknown }>).map(cf => [cf.key, cf.value])
      ) : {},
      ghlCreatedAt: contact.dateAdded || null,
      ghlUpdatedAt: contact.dateUpdated || null,
    };

    let result;

    if (existingLead) {
      // Update existing lead
      const { data, error } = await supabaseAdmin
        .from('GhlLead')
        .update(leadData)
        .eq('id', existingLead.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new lead
      const insertData: GhlLeadInsert = {
        ...leadData as GhlLeadInsert,
        status: 'new',
        monetaryValue: 0,
        estimatedValue: 0,
        actualValue: 0,
      };

      const { data, error } = await supabaseAdmin
        .from('GhlLead')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Mark event as processed
    if (eventId) {
      await markEventProcessed(eventId);
    }

    return result as GhlLead;
  } catch (error) {
    console.error('Error processing contact event:', error);
    if (eventId) {
      await markEventProcessed(eventId, error instanceof Error ? error.message : 'Unknown error');
    }
    return null;
  }
}

export async function processOpportunityEvent(
  connection: GhlConnection,
  opportunity: GhlOpportunityPayload,
  eventId?: string
): Promise<GhlLead | null> {
  try {
    // Find the lead by contact ID
    const { data: existingLead } = await supabaseAdmin
      .from('GhlLead')
      .select('*')
      .eq('tenantId', connection.tenantId)
      .eq('ghlContactId', opportunity.contactId)
      .single();

    if (!existingLead) {
      // Lead doesn't exist yet, we might need to fetch contact info
      console.log('Lead not found for opportunity:', opportunity.id);
      if (eventId) {
        await markEventProcessed(eventId, 'Lead not found for opportunity');
      }
      return null;
    }

    // Determine status based on stage mapping
    const newStatus = opportunity.pipelineStageId
      ? mapStageToStatus(opportunity.pipelineStageId, connection.stageMapping)
      : existingLead.status;

    const updateData: GhlLeadUpdate = {
      ghlOpportunityId: opportunity.id,
      pipelineId: opportunity.pipelineId || null,
      stageId: opportunity.pipelineStageId || null,
      monetaryValue: opportunity.monetaryValue || existingLead.monetaryValue,
      estimatedValue: opportunity.monetaryValue || existingLead.estimatedValue,
      assignedUserId: opportunity.assignedTo || null,
      status: newStatus,
      ghlUpdatedAt: opportunity.dateUpdated || new Date().toISOString(),
    };

    // Set timestamps based on status changes
    if (newStatus === 'won' && existingLead.status !== 'won') {
      updateData.wonAt = new Date().toISOString();
      updateData.actualValue = opportunity.monetaryValue || existingLead.estimatedValue;
    }

    if (newStatus === 'lost' && existingLead.status !== 'lost') {
      updateData.lostAt = new Date().toISOString();
    }

    if (newStatus === 'estimate_sent' && existingLead.status !== 'estimate_sent') {
      updateData.estimateSentAt = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('GhlLead')
      .update(updateData)
      .eq('id', existingLead.id)
      .select()
      .single();

    if (error) throw error;

    // Mark event as processed
    if (eventId) {
      await markEventProcessed(eventId);
    }

    return data as GhlLead;
  } catch (error) {
    console.error('Error processing opportunity event:', error);
    if (eventId) {
      await markEventProcessed(eventId, error instanceof Error ? error.message : 'Unknown error');
    }
    return null;
  }
}

// ============================================
// WEBHOOK HANDLER
// ============================================

export async function handleWebhook(
  payload: GhlWebhookPayload,
  webhookSecret?: string
): Promise<{ success: boolean; error?: string; leadId?: string }> {
  const { type, locationId } = payload;

  // Find connection by location ID
  const connection = await getConnectionByLocationId(locationId);

  if (!connection) {
    return { success: false, error: 'Unknown location ID' };
  }

  // Validate webhook secret if configured
  if (connection.webhookSecret && webhookSecret !== connection.webhookSecret) {
    return { success: false, error: 'Invalid webhook secret' };
  }

  // Save raw event first
  const eventId = await saveRawEvent(
    connection.id,
    connection.tenantId,
    locationId,
    type,
    payload as unknown as Record<string, unknown>
  );

  if (!eventId) {
    return { success: false, error: 'Failed to save raw event' };
  }

  // Process based on event type
  let lead: GhlLead | null = null;

  switch (type) {
    case 'ContactCreate':
    case 'ContactUpdate':
      if (payload.contact) {
        lead = await processContactEvent(connection, payload.contact, eventId);
      }
      break;

    case 'OpportunityCreate':
    case 'OpportunityUpdate':
    case 'OpportunityStageUpdate':
    case 'OpportunityStatusUpdate':
      if (payload.opportunity) {
        lead = await processOpportunityEvent(connection, payload.opportunity, eventId);
      }
      break;

    default:
      // Just save raw event for other types
      await markEventProcessed(eventId);
      break;
  }

  return {
    success: true,
    leadId: lead?.id,
  };
}

// ============================================
// SYNC FUNCTIONS (Polling backup)
// ============================================

export async function syncContacts(connection: GhlConnection): Promise<number> {
  let synced = 0;
  let hasMore = true;
  let startAfterId: string | undefined;

  try {
    while (hasMore) {
      const params = new URLSearchParams({
        locationId: connection.locationId,
        limit: '100',
      });

      if (startAfterId) {
        params.set('startAfterId', startAfterId);
      }

      const response = await ghlApiRequest(
        connection,
        `/contacts/?${params.toString()}`
      ) as { contacts?: GhlContactPayload[]; meta?: { startAfterId?: string } };

      const contacts = response.contacts || [];

      for (const contact of contacts) {
        await processContactEvent(connection, contact);
        synced++;
      }

      startAfterId = response.meta?.startAfterId;
      hasMore = !!startAfterId && contacts.length === 100;
    }

    // Update last sync time
    await supabaseAdmin
      .from('GhlConnection')
      .update({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncError: null,
      })
      .eq('id', connection.id);

  } catch (error) {
    await supabaseAdmin
      .from('GhlConnection')
      .update({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'error',
        lastSyncError: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', connection.id);

    throw error;
  }

  return synced;
}

export async function syncOpportunities(connection: GhlConnection): Promise<number> {
  let synced = 0;

  try {
    // Get all pipelines
    const pipelines = await getPipelines(connection);

    for (const pipeline of pipelines) {
      const params = new URLSearchParams({
        locationId: connection.locationId,
        pipelineId: pipeline.id,
        limit: '100',
      });

      const response = await ghlApiRequest(
        connection,
        `/opportunities/search?${params.toString()}`
      ) as { opportunities?: GhlOpportunityPayload[] };

      const opportunities = response.opportunities || [];

      for (const opp of opportunities) {
        await processOpportunityEvent(connection, opp);
        synced++;
      }
    }

    // Update last sync time
    await supabaseAdmin
      .from('GhlConnection')
      .update({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'success',
        lastSyncError: null,
      })
      .eq('id', connection.id);

  } catch (error) {
    await supabaseAdmin
      .from('GhlConnection')
      .update({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: 'error',
        lastSyncError: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', connection.id);

    throw error;
  }

  return synced;
}

export async function fullSync(connection: GhlConnection): Promise<{ contacts: number; opportunities: number }> {
  const contacts = await syncContacts(connection);
  const opportunities = await syncOpportunities(connection);

  return { contacts, opportunities };
}
