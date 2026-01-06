import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const usePushNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  // Check if notifications are supported
  useEffect(() => {
    const supported = 'Notification' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.log('[Push] Notifications not supported');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      console.log('[Push] Permission result:', result);
      return result;
    } catch (error) {
      console.error('[Push] Permission request failed:', error);
      return 'denied';
    }
  }, [isSupported]);

  // Show a browser notification
  const showNotification = useCallback((title: string, body: string, icon?: string) => {
    if (permission !== 'granted' || !isSupported) {
      console.log('[Push] Cannot show notification - permission:', permission, 'supported:', isSupported);
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `notification-${Date.now()}`,
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('[Push] Failed to show notification:', error);
    }
  }, [permission, isSupported]);

  // Subscribe to real-time notification inserts
  useEffect(() => {
    if (!user?.id || permission !== 'granted') return;

    console.log('[Push] Subscribing to notifications for user:', user.id);

    const channel = supabase
      .channel(`push-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('[Push] New notification received:', payload);

          // Fetch the notification content
          const { data, error } = await supabase
            .from('notifications')
            .select('title, message, image_url')
            .eq('id', payload.new.notification_id)
            .single();

          if (error) {
            console.error('[Push] Failed to fetch notification details:', error);
            return;
          }

          if (data) {
            showNotification(data.title, data.message, data.image_url || undefined);
          }
        }
      )
      .subscribe((status) => {
        console.log('[Push] Subscription status:', status);
      });

    return () => {
      console.log('[Push] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, permission, showNotification]);

  return {
    permission,
    isSupported,
    isEnabled: permission === 'granted',
    requestPermission,
    showNotification,
  };
};
