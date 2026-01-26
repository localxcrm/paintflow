'use client';

import { useEffect, useRef } from 'react';
import { 
  isNativeApp, 
  registerNativePush, 
  setupPushListeners, 
  saveDeviceToken 
} from '@/lib/capacitor-push';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PushInitProps {
  userId?: string;
}

/**
 * Component to initialize push notifications for the sub app
 * Should be rendered once in the layout when user is authenticated
 */
export function PushInit({ userId }: PushInitProps) {
  const router = useRouter();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    async function initPush() {
      // Only proceed if running as native app
      if (!isNativeApp()) {
        console.log('Not a native app, skipping push registration');
        return;
      }

      try {
        // Register for push notifications
        const token = await registerNativePush();
        
        if (token) {
          // Save token to server
          const saved = await saveDeviceToken(token, userId);
          if (saved) {
            console.log('Push notification token saved successfully');
          } else {
            console.warn('Failed to save push token to server');
          }
        }
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    }

    // Setup push notification listeners
    const cleanup = setupPushListeners(
      // Notification received in foreground
      (notification) => {
        console.log('Push received in foreground:', notification);
        toast.info(notification.title || 'Nova notificação', {
          description: notification.body,
          action: notification.data?.url ? {
            label: 'Ver',
            onClick: () => router.push(notification.data.url),
          } : undefined,
        });
      },
      // Notification tapped
      (action) => {
        console.log('Push notification tapped:', action);
        const url = action.notification.data?.url;
        if (url) {
          router.push(url);
        }
      }
    );

    initPush();

    return cleanup;
  }, [userId, router]);

  return null;
}
