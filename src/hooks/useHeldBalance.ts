import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Coins locked in active tournaments (escrow). Not withdrawable, not spendable.
 */
export const useHeldBalance = () => {
  const { user } = useAuth();
  const [held, setHeld] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchNow = async () => {
    if (!user?.id) return 0;
    const { data } = await supabase
      .from("profiles")
      .select("held_balance")
      .eq("id", user.id)
      .maybeSingle();
    const v = Number((data as any)?.held_balance ?? 0);
    setHeld(v);
    return v;
  };

  useEffect(() => {
    if (!user?.id) {
      setHeld(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchNow().finally(() => setLoading(false));

    const channel = supabase
      .channel(`held-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload: any) => {
          if (payload.new?.held_balance !== undefined) {
            setHeld(Number(payload.new.held_balance));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { held, loading, fetchNow };
};
