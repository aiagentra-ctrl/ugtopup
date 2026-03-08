import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useAdminPushNotifications = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  const isSupported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const getVapidPublicKey = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      if (error) throw error;
      return data?.publicKey || null;
    } catch (error) {
      console.error('[AdminPush] Failed to fetch VAPID key:', error);
      return null;
    }
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user?.id) return false;

    try {
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) return false;

      const registration = await navigator.serviceWorker.ready;

      const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4);
      const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = atob(base64);
      const applicationServerKey = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        applicationServerKey[i] = rawData.charCodeAt(i);
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const json = subscription.toJSON();
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: user.id,
            endpoint: json.endpoint!,
            p256dh: json.keys!.p256dh!,
            auth: json.keys!.auth!,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,endpoint' }
        );

      if (error) {
        console.error('[AdminPush] Failed to save subscription:', error);
        return false;
      }

      console.log('[AdminPush] Admin subscribed to push notifications');
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('[AdminPush] Subscription failed:', error);
      return false;
    }
  }, [isSupported, user?.id, getVapidPublicKey]);

  const requestAndSubscribe = useCallback(async () => {
    if (!isSupported) return;

    try {
      const result = await Notification.requestPermission();
      setPermissionState(result);
      if (result === 'granted') {
        await subscribe();
      }
    } catch (error) {
      console.error('[AdminPush] Permission request failed:', error);
    }
  }, [isSupported, subscribe]);

  // Auto-subscribe if permission already granted
  useEffect(() => {
    if (permissionState === 'granted' && !isSubscribed && user?.id && isSupported) {
      subscribe();
    }
  }, [permissionState, isSubscribed, user?.id, isSupported, subscribe]);

  return {
    isSupported,
    isSubscribed,
    permission: permissionState,
    requestAndSubscribe,
  };
};
