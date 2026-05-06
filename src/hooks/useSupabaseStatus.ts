import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SupabaseStatus {
  loading: boolean;
  suspended: boolean;
  reason: string | null;
  message: string | null;
  checkedAt: Date | null;
}

const RESTRICTION_KEYWORDS = [
  "exceed_cached_egress_quota",
  "exceed_egress_quota",
  "Service for this project is restricted",
  "project is restricted",
];

/**
 * Lightweight ping that detects when the Supabase project has been
 * suspended (e.g. exceeded cached egress quota on the Free plan).
 * Used to block cleanup actions and show a clear reason banner.
 */
export function useSupabaseStatus(pollMs = 0): SupabaseStatus {
  const [status, setStatus] = useState<SupabaseStatus>({
    loading: true,
    suspended: false,
    reason: null,
    message: null,
    checkedAt: null,
  });

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        // Tiny HEAD request — minimal egress, returns the restriction
        // message body when the project is suspended.
        const { error } = await supabase
          .from("cleanup_settings")
          .select("id", { count: "exact", head: true })
          .limit(1);

        if (cancelled) return;

        const raw = error?.message || "";
        const matched = RESTRICTION_KEYWORDS.find((k) =>
          raw.toLowerCase().includes(k.toLowerCase())
        );

        if (matched) {
          setStatus({
            loading: false,
            suspended: true,
            reason: matched.includes("egress")
              ? "exceed_cached_egress_quota"
              : "project_restricted",
            message: raw,
            checkedAt: new Date(),
          });
        } else {
          setStatus({
            loading: false,
            suspended: false,
            reason: null,
            message: null,
            checkedAt: new Date(),
          });
        }
      } catch (e: any) {
        if (cancelled) return;
        const raw = String(e?.message || e || "");
        const matched = RESTRICTION_KEYWORDS.find((k) =>
          raw.toLowerCase().includes(k.toLowerCase())
        );
        setStatus({
          loading: false,
          suspended: !!matched,
          reason: matched ? "exceed_cached_egress_quota" : null,
          message: matched ? raw : null,
          checkedAt: new Date(),
        });
      }
    };

    check();
    let interval: number | undefined;
    if (pollMs > 0) {
      interval = window.setInterval(check, pollMs);
    }
    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [pollMs]);

  return status;
}
