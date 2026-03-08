import { supabase } from "@/integrations/supabase/client";

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  created_at: string;
}

export async function fetchWishlist(): Promise<WishlistItem[]> {
  const { data, error } = await supabase
    .from('wishlists' as any)
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as unknown as WishlistItem[]) || [];
}

export async function addToWishlist(productId: string, productName: string): Promise<WishlistItem> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { data, error } = await supabase
    .from('wishlists' as any)
    .insert({ user_id: user.id, product_id: productId, product_name: productName } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as WishlistItem;
}

export async function removeFromWishlist(productId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  const { error } = await supabase
    .from('wishlists' as any)
    .delete()
    .eq('user_id', user.id)
    .eq('product_id', productId);
  if (error) throw error;
}

export async function isInWishlist(productId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data, error } = await supabase
    .from('wishlists' as any)
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();
  if (error) return false;
  return !!data;
}
