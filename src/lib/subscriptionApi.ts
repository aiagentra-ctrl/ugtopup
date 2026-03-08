import { supabase } from "@/integrations/supabase/client";

export interface Subscription {
  id: string;
  user_id: string;
  product_category: string;
  product_name: string;
  package_name: string;
  price: number;
  frequency: string;
  next_run_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchUserSubscriptions(): Promise<Subscription[]> {
  const { data, error } = await supabase
    .from('subscriptions' as any)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as Subscription[]) || [];
}

export async function createSubscription(sub: Partial<Subscription>): Promise<Subscription> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('subscriptions' as any)
    .insert({ ...sub, user_id: user.id } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as Subscription;
}

export async function toggleSubscription(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('subscriptions' as any)
    .update({ is_active: isActive, updated_at: new Date().toISOString() } as any)
    .eq('id', id);
  if (error) throw error;
}

export async function deleteSubscription(id: string): Promise<void> {
  const { error } = await supabase
    .from('subscriptions' as any)
    .delete()
    .eq('id', id);
  if (error) throw error;
}
