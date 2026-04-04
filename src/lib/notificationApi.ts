import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  image_url: string | null;
  target_type: 'all' | 'specific';
  target_emails: string[] | null;
  notification_type: 'admin' | 'general';
  created_by: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserNotification {
  id: string;
  notification_id: string;
  user_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  notification?: Notification;
}

export interface NotificationStats {
  sent_count: number;
  read_count: number;
}

// Admin functions
export const fetchAllNotifications = async (limit = 100): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, target_type, notification_type, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data as Notification[];
};

export const createNotification = async (
  notification: {
    title: string;
    message: string;
    image_url?: string | null;
    target_type: 'all' | 'specific';
    target_emails?: string[] | null;
    notification_type?: 'admin' | 'general';
  }
): Promise<Notification> => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
      notification_type: notification.notification_type || 'admin',
      created_by: userData?.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
};

export const updateNotification = async (
  id: string,
  updates: Partial<{
    title: string;
    message: string;
    image_url: string | null;
    target_type: 'all' | 'specific';
    target_emails: string[] | null;
    notification_type: 'admin' | 'general';
    is_active: boolean;
  }>
): Promise<Notification> => {
  const { data, error } = await supabase
    .from('notifications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Notification;
};

export const deleteNotification = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getNotificationStats = async (notificationId: string): Promise<NotificationStats> => {
  const { data, error } = await supabase
    .from('user_notifications')
    .select('is_read')
    .eq('notification_id', notificationId);

  if (error) throw error;

  const sent_count = data?.length || 0;
  const read_count = data?.filter(n => n.is_read).length || 0;

  return { sent_count, read_count };
};

// User functions - FIXED: explicitly filter by user_id
export const fetchUserNotifications = async (notificationType?: string): Promise<UserNotification[]> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return [];

  let query = supabase
    .from('user_notifications')
    .select(`
      id, notification_id, user_id, is_read, read_at, created_at,
      notification:notifications(id, title, message, notification_type, created_at, image_url)
    `)
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const { data, error } = await query;

  if (error) throw error;
  
  let filtered = data as UserNotification[];
  if (notificationType) {
    filtered = filtered.filter(un => 
      un.notification && (un.notification as any).notification_type === notificationType
    );
  }
  
  return filtered;
};

export const markNotificationAsRead = async (userNotificationId: string): Promise<void> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return;

  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', userNotificationId)
    .eq('user_id', userData.user.id);

  if (error) throw error;
};

export const markAllNotificationsAsRead = async (notificationType?: string): Promise<void> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return;

  if (notificationType) {
    // Fetch user's own unread notifications with join to filter by type
    const { data: unreadNotifs } = await supabase
      .from('user_notifications')
      .select('id, notification:notifications(notification_type)')
      .eq('user_id', userData.user.id)
      .eq('is_read', false);

    if (unreadNotifs && unreadNotifs.length > 0) {
      const idsToMark = unreadNotifs
        .filter(un => (un.notification as any)?.notification_type === notificationType)
        .map(un => un.id);

      if (idsToMark.length > 0) {
        const { error } = await supabase
          .from('user_notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', userData.user.id)
          .in('id', idsToMark);

        if (error) throw error;
      }
    }
  } else {
    const { error } = await supabase
      .from('user_notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);

    if (error) throw error;
  }
};

export const getUnreadCount = async (): Promise<number> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return 0;

  const { count, error } = await supabase
    .from('user_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userData.user.id)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
};

// Resolve usernames to emails for targeting
export const resolveUsernamesToEmails = async (usernames: string[]): Promise<string[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('email, username')
    .in('username', usernames);

  if (error) throw error;
  return (data || []).map(p => p.email);
};

// Storage functions
export const uploadNotificationImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  const { error } = await supabase.storage
    .from('notification-images')
    .upload(fileName, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('notification-images')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};

export const deleteNotificationImage = async (imageUrl: string): Promise<void> => {
  const fileName = imageUrl.split('/').pop();
  if (!fileName) return;

  const { error } = await supabase.storage
    .from('notification-images')
    .remove([fileName]);

  if (error) console.error('Failed to delete image:', error);
};