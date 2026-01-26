// Push Service - Server-side push notification utilities
// This module handles sending push notifications directly without HTTP calls

import webpush from 'web-push';
import { createServerSupabaseClient } from './supabase-server';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:contato@paintpro.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export type NotificationType = 
  | 'job_assigned'
  | 'payout_ready'
  | 'payout_paid'
  | 'new_message'
  | 'compliance_reminder';

interface NotificationConfig {
  title: string;
  bodyTemplate: string;
}

const NOTIFICATION_TEMPLATES: Record<NotificationType, NotificationConfig> = {
  job_assigned: {
    title: 'Novo Trabalho Atribuído',
    bodyTemplate: 'Você foi designado para o trabalho {jobNumber} em {address}',
  },
  payout_ready: {
    title: 'Pagamento Disponível',
    bodyTemplate: 'Seu pagamento de {amount} está pronto para o trabalho {jobNumber}',
  },
  payout_paid: {
    title: 'Pagamento Realizado',
    bodyTemplate: 'Pagamento de {amount} foi processado para o trabalho {jobNumber}',
  },
  new_message: {
    title: 'Nova Mensagem',
    bodyTemplate: 'Você recebeu uma nova mensagem sobre {jobNumber}',
  },
  compliance_reminder: {
    title: 'Documentação Expirando',
    bodyTemplate: 'Sua {docType} vence em {days} dias',
  },
};

// ============================================
// SEND TO SUBCONTRACTOR
// ============================================

interface SendToSubParams {
  subcontractorId: string;
  type: NotificationType;
  data: Record<string, string | number>;
  url?: string;
}

/**
 * Send push notification to a subcontractor
 */
export async function sendPushToSubcontractor(params: SendToSubParams): Promise<{
  sent: number;
  failed: number;
}> {
  const { subcontractorId, type, data, url } = params;

  const supabase = createServerSupabaseClient();

  // Get device tokens for this subcontractor
  const { data: tokens, error } = await supabase
    .from('DeviceToken')
    .select('*')
    .eq('subcontractorId', subcontractorId)
    .eq('isActive', true);

  if (error || !tokens?.length) {
    console.log('No active device tokens for subcontractor:', subcontractorId);
    return { sent: 0, failed: 0 };
  }

  const template = NOTIFICATION_TEMPLATES[type];
  const title = template.title;
  let body = template.bodyTemplate;

  // Replace template variables
  Object.entries(data).forEach(([key, value]) => {
    body = body.replace(`{${key}}`, String(value));
  });

  const results = await Promise.allSettled(
    tokens.map(async (token: { platform: string; token: string; id: string }) => {
      if (token.platform === 'ios') {
        // For iOS, we'd use APNS (Apple Push Notification Service)
        // For now, log and skip - in production, use a service like Firebase or OneSignal
        console.log(`[APNS] Would send to iOS device: ${title} - ${body}`);
        return { success: true };
      } else if (token.platform === 'android') {
        // For Android, we'd use FCM (Firebase Cloud Messaging)
        console.log(`[FCM] Would send to Android device: ${title} - ${body}`);
        return { success: true };
      } else if (token.platform === 'web' && vapidPublicKey && vapidPrivateKey) {
        // Web push
        try {
          const subscription = JSON.parse(token.token);
          await webpush.sendNotification(
            subscription,
            JSON.stringify({ title, body, url })
          );
          return { success: true };
        } catch (err) {
          console.error('Web push failed:', err);
          throw err;
        }
      }
      return { success: true };
    })
  );

  // Log notification
  await supabase.from('PushNotificationLog').insert({
    recipientType: 'sub',
    recipientId: subcontractorId,
    type,
    title,
    body,
    data,
    status: 'sent',
  });

  const sent = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return { sent, failed };
}

/**
 * Notify subcontractor of job assignment
 */
export async function notifyJobAssigned(
  subcontractorId: string,
  jobNumber: string,
  address: string,
  jobId: string
): Promise<void> {
  await sendPushToSubcontractor({
    subcontractorId,
    type: 'job_assigned',
    data: { jobNumber, address },
    url: `/sub/os/${jobId}`,
  });
}

/**
 * Notify subcontractor of payout ready
 */
export async function notifyPayoutReady(
  subcontractorId: string,
  amount: number,
  jobNumber: string,
  payoutId: string
): Promise<void> {
  await sendPushToSubcontractor({
    subcontractorId,
    type: 'payout_ready',
    data: { 
      amount: `$${amount.toFixed(0)}`,
      jobNumber,
    },
    url: `/sub/financeiro/${payoutId}`,
  });
}

/**
 * Notify subcontractor of payout paid
 */
export async function notifyPayoutPaid(
  subcontractorId: string,
  amount: number,
  jobNumber: string
): Promise<void> {
  await sendPushToSubcontractor({
    subcontractorId,
    type: 'payout_paid',
    data: { 
      amount: `$${amount.toFixed(0)}`,
      jobNumber,
    },
    url: '/sub/financeiro',
  });
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  workOrderId?: string;
  tag?: string;
}

interface SendPushParams {
  organizationId: string;
  workOrderToken: string;
  targetUserType: 'admin' | 'subcontractor';
  title: string;
  message: string;
  url: string;
  workOrderId?: string;
}

/**
 * Send push notification to users
 * This function is called directly from API routes without HTTP
 */
export async function sendPushToUser(params: SendPushParams): Promise<{
  sent: number;
  failed: number;
  total: number;
}> {
  const {
    organizationId,
    workOrderToken,
    targetUserType,
    title,
    message,
    url,
    workOrderId,
  } = params;

  // Check VAPID configuration
  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn('VAPID keys not configured, skipping push notification');
    return { sent: 0, failed: 0, total: 0 };
  }

  try {
    const supabase = createServerSupabaseClient();

    // Build query to find subscriptions
    let query = supabase
      .from('PushSubscription')
      .select('*')
      .eq('userType', targetUserType);

    // Filter by organization or work order token
    if (targetUserType === 'admin' && organizationId) {
      query = query.eq('organizationId', organizationId);
    } else if (targetUserType === 'subcontractor' && workOrderToken) {
      query = query.eq('workOrderToken', workOrderToken);
    } else {
      console.warn('Missing organizationId or workOrderToken for push notification');
      return { sent: 0, failed: 0, total: 0 };
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      return { sent: 0, failed: 0, total: 0 };
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for', targetUserType);
      return { sent: 0, failed: 0, total: 0 };
    }

    // Prepare notification payload
    const payload: PushPayload = {
      title: title || 'PaintPro',
      body: message || 'Nova mensagem',
      url: url || '/',
      workOrderId,
      tag: `paintpro-${workOrderId || 'general'}`,
    };

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub: any) => {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: sub.keys,
        };

        try {
          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(payload)
          );
          return { success: true, endpoint: sub.endpoint };
        } catch (error: unknown) {
          const pushError = error as { statusCode?: number };
          // If subscription is expired or invalid, delete it
          if (pushError.statusCode === 410 || pushError.statusCode === 404) {
            await supabase
              .from('PushSubscription')
              .delete()
              .eq('endpoint', sub.endpoint);
            console.log('Deleted expired subscription:', sub.endpoint);
          }
          throw error;
        }
      })
    );

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(`Push notifications: ${successful} sent, ${failed} failed`);

    return {
      sent: successful,
      failed,
      total: subscriptions.length,
    };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return { sent: 0, failed: 0, total: 0 };
  }
}
