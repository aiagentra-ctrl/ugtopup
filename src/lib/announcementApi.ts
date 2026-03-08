import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  target: string;
  target_emails: string[] | null;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
}

export async function fetchActiveAnnouncements(): Promise<Announcement[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('announcements' as any)
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as Announcement[]) || [];
}

export async function fetchAllAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await supabase
    .from('announcements' as any)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as Announcement[]) || [];
}

export async function createAnnouncement(announcement: Partial<Announcement>): Promise<Announcement> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('announcements' as any)
    .insert({ ...announcement, created_by: user?.id } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Announcement;
}

export async function updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<void> {
  const { error } = await supabase
    .from('announcements' as any)
    .update(updates as any)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await supabase
    .from('announcements' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
