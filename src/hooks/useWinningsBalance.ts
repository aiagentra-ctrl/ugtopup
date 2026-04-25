import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Live tournament winnings balance — withdrawable to NPR.
 * Separate from `profiles.balance` (deposited credits, NOT withdrawable).
 */
export const useWinningsBalance = () => {
  const { user } = useAuth();
  const [winnings, setWinnings] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchNow = async () => {
    if (!user?.id) return 0;
    const { data } = await supabase
      .from("profiles")
      .select("winnings_balance")
      .eq("id", user.id)
      .maybeSingle();
    const v = Number((data as any)?.winnings_balance ?? 0);
    setWinnings(v);
    return v;
  };

  useEffect(() => {
    if (!user?.id) {
      setWinnings(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchNow().finally(() => setLoading(false));

    const channel = supabase
      .channel(`winnings-${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload: any) => {
          if (payload.new?.winnings_balance !== undefined) {
            setWinnings(Number(payload.new.winnings_balance));
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { winnings, loading, fetchNow };
};
