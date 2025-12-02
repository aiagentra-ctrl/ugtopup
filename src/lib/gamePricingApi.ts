import { supabase } from '@/integrations/supabase/client';
import type { GamePrice } from '@/hooks/useGamePrices';

// Fetch all prices for a game (admin view - includes inactive)
export const fetchAllGamePrices = async (game: string): Promise<GamePrice[]> => {
  const { data, error } = await supabase
    .from('game_product_prices')
    .select('*')
    .eq('game', game)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Update a single price
export const updateGamePrice = async (
  id: string,
  newPrice: number
): Promise<void> => {
  const { error } = await supabase
    .from('game_product_prices')
    .update({ price: newPrice })
    .eq('id', id);

  if (error) throw error;
};

// Update package with quantity and/or price
export const updateGamePackage = async (
  id: string,
  updates: { quantity?: number; price?: number; package_name?: string }
): Promise<void> => {
  const { error } = await supabase
    .from('game_product_prices')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
};

// Bulk update prices
export const bulkUpdatePrices = async (
  updates: { id: string; price: number }[]
): Promise<void> => {
  // Use Promise.all for parallel updates
  await Promise.all(
    updates.map(({ id, price }) =>
      supabase
        .from('game_product_prices')
        .update({ price })
        .eq('id', id)
    )
  );
};

// Toggle package active status
export const togglePackageActive = async (
  id: string,
  isActive: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('game_product_prices')
    .update({ is_active: isActive })
    .eq('id', id);

  if (error) throw error;
};
