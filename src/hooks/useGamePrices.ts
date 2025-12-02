import { useState, useEffect } from 'react';
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
}

export const useGamePrices = (game: string) => {
  const [prices, setPrices] = useState<GamePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial prices
  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('game_product_prices')
          .select('*')
          .eq('game', game)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;
        setPrices(data || []);
      } catch (err) {
        console.error('Error fetching game prices:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [game]);

  // Subscribe to real-time updates
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
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setPrices((prev) =>
              prev.map((p) =>
                p.id === (payload.new as GamePrice).id
                  ? (payload.new as GamePrice)
                  : p
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setPrices((prev) => [...prev, payload.new as GamePrice]);
          } else if (payload.eventType === 'DELETE') {
            setPrices((prev) =>
              prev.filter((p) => p.id !== (payload.old as GamePrice).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game]);

  // Helper to get price by package type
  const getPricesByType = (type: string) => {
    return prices.filter((p) => p.package_type === type);
  };

  // Refresh prices from DB
  const refresh = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('game_product_prices')
        .select('*')
        .eq('game', game)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setPrices(data || []);
    } catch (err) {
      console.error('Error refreshing prices:', err);
    } finally {
      setLoading(false);
    }
  };

  return { prices, loading, error, getPricesByType, refresh };
};
