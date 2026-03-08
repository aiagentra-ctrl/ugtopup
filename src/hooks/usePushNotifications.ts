import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Check existing subscription status
  useEffect(() => {
    if (!isSupported || !user?.id) return;

    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('[Push] Error checking subscription:', error);
      }
    };
    
    checkSubscription();
  }, [isSupported, user?.id]);

  // Fetch VAPID public key from edge function
  const getVapidPublicKey = useCallback(async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-vapid-key');
      if (error) throw error;
      return data?.publicKey || null;
    } catch (error) {
      console.error('[Push] Failed to fetch VAPID key:', error);
      return null;
    }
  }, []);

  // Subscribe to push notifications
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user?.id) return false;

    try {
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        console.error('[Push] No VAPID public key available');
        return false;
      }

      const registration = await navigator.serviceWorker.ready;

      // Convert VAPID key to Uint8Array
      const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4);
      const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = atob(base64);
      const applicationServerKey = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; i++) {
        applicationServerKey[i] = rawData.charCodeAt(i);
      }

      // Subscribe via Push API
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      const subscriptionJson = subscription.toJSON();
      const endpoint = subscriptionJson.endpoint!;
      const p256dh = subscriptionJson.keys!.p256dh!;
      const auth = subscriptionJson.keys!.auth!;

      // Save to database (upsert by user_id + endpoint)
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(
          {
            user_id: user.id,
            endpoint,
            p256dh,
            auth,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,endpoint' }
        );

      if (error) {
        console.error('[Push] Failed to save subscription:', error);
        return false;
      }

      console.log('[Push] Successfully subscribed to push notifications');
      setIsSubscribed(true);
      return true;
    } catch (error) {
      console.error('[Push] Subscription failed:', error);
      return false;
    }
  }, [isSupported, user?.id, getVapidPublicKey]);

  // Request notification permission and subscribe
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.log('[Push] Notifications not supported');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      console.log('[Push] Permission result:', result);

      // If granted, automatically subscribe to push
      if (result === 'granted') {
        await subscribeToPush();
      }

      return result;
    } catch (error) {
      console.error('[Push] Permission request failed:', error);
      return 'denied';
    }
  }, [isSupported, subscribeToPush]);

  // Auto-subscribe if permission already granted but not subscribed
  useEffect(() => {
    if (permission === 'granted' && !isSubscribed && user?.id && isSupported) {
      subscribeToPush();
    }
  }, [permission, isSubscribed, user?.id, isSupported, subscribeToPush]);

  return {
    permission,
    isSupported,
    isEnabled: permission === 'granted',
    isSubscribed,
    requestPermission,
    subscribeToPush,
  };
};
