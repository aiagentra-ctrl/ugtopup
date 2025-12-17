import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  title: string;
  message: string;
  image_url: string | null;
  target_type: 'all' | 'specific';
  target_emails: string[] | null;
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
export const fetchAllNotifications = async (): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });

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
  }
): Promise<Notification> => {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      ...notification,
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

// User functions
export const fetchUserNotifications = async (): Promise<UserNotification[]> => {
  const { data, error } = await supabase
    .from('user_notifications')
    .select(`
      *,
      notification:notifications(*)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as UserNotification[];
};

export const markNotificationAsRead = async (userNotificationId: string): Promise<void> => {
  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', userNotificationId);

  if (error) throw error;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user?.id) return;

  const { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('user_id', userData.user.id)
    .eq('is_read', false);

  if (error) throw error;
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
