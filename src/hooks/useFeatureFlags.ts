import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface FeatureFlag {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_enabled: boolean;
  category: string;
  monthly_cost_note: string | null;
  depends_on: string | null;
  disabled_message: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    const { data, error } = await supabase
      .from('feature_flags' as any)
      .select('*')
      .order('feature_name');

    if (!error && data) {
      setFlags(data as unknown as FeatureFlag[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFlags();

    const channel = supabase
      .channel('feature-flags-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feature_flags' },
        () => { fetchFlags(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchFlags]);

  const isFeatureEnabled = useCallback(
    (key: string) => {
      const flag = flags.find(f => f.feature_key === key);
      return flag ? flag.is_enabled : true; // default enabled if not found
    },
    [flags]
  );

  const toggleFeature = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('feature_flags' as any)
      .update({ is_enabled: enabled, updated_at: new Date().toISOString() } as any)
      .eq('id', id);
    return { error };
  };

  return { flags, loading, isFeatureEnabled, toggleFeature, refetch: fetchFlags };
}
