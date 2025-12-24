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
      subscriptions.map(async (sub) => {
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
