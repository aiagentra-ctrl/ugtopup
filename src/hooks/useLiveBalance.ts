import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useLiveBalance = () => {
  const { profile, user } = useAuth();
  const [balance, setBalance] = useState<number>(profile?.balance || 0);
  const [loading, setLoading] = useState(false);

  // Sync with profile prop
  useEffect(() => {
    setBalance(profile?.balance || 0);
  }, [profile?.balance]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`balance-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          setBalance(payload.new.balance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Fetch latest balance from DB
  const fetchNow = async (): Promise<number> => {
    if (!user?.id) return 0;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      const freshBalance = data?.balance || 0;
      setBalance(freshBalance);
      return freshBalance;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return balance;
    } finally {
      setLoading(false);
    }
  };

  return { balance, loading, fetchNow };
};
