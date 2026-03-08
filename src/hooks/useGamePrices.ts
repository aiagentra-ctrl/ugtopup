import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GamePrice {
  id: string;
  game: string;
  package_id: string;
  package_name: string;
  package_type: string;
  quantity: number;
  price: number;
  currency: string;
  is_active: boolean;
  display_order: number;
  is_api_product?: boolean;
}

async function fetchGamePrices(game: string): Promise<GamePrice[]> {
  const { data, error } = await supabase
    .from('game_product_prices')
    .select('*')
    .eq('game', game)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return (data || []) as GamePrice[];
}

export const useGamePrices = (game: string) => {
  const queryClient = useQueryClient();

  const { data: prices = [], isLoading: loading, error } = useQuery({
    queryKey: ['game-prices', game],
    queryFn: () => fetchGamePrices(game),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`game-prices-${game}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_product_prices',
          filter: `game=eq.${game}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['game-prices', game] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [game, queryClient]);

  const getPricesByType = (type: string) => prices.filter((p) => p.package_type === type);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['game-prices', game] });

  return { prices, loading, error: error instanceof Error ? error.message : null, getPricesByType, refresh };
};
