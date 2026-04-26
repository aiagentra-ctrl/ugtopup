import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

function getSessionId(): string {
  let sid = sessionStorage.getItem("_track_sid");
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem("_track_sid", sid);
  }
  return sid;
}

function detectTrafficSource(): { source: string; referrer: string } {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get("utm_source");
  const ref = document.referrer;

  if (utmSource) {
    if (utmSource.includes("google")) return { source: "google", referrer: ref };
    if (["facebook", "instagram", "twitter", "tiktok", "youtube"].some(s => utmSource.includes(s)))
      return { source: "social", referrer: ref };
    return { source: "referral", referrer: ref };
  }

  if (ref) {
    try {
      const hostname = new URL(ref).hostname;
      if (hostname.includes("google")) return { source: "google", referrer: ref };
      if (["facebook", "instagram", "twitter", "tiktok", "youtube", "t.co"].some(s => hostname.includes(s)))
        return { source: "social", referrer: ref };
      if (!hostname.includes(window.location.hostname))
        return { source: "referral", referrer: ref };
    } catch { /* ignore */ }
  }

  return { source: "direct", referrer: "" };
}

export function usePageTracking() {
  const location = useLocation();
  const pageCountRef = useRef(0);
  const trafficInfo = useRef(detectTrafficSource());

  useEffect(() => {
    const sessionId = getSessionId();
    const { source, referrer } = trafficInfo.current;
    pageCountRef.current++;
    const currentCount = pageCountRef.current;

    // Record page view (fire and forget)
    supabase.from("page_views").insert({
      session_id: sessionId,
      page_path: location.pathname,
      page_title: document.title,
      referrer: currentCount === 1 ? referrer : "",
      traffic_source: source,
      user_agent: navigator.userAgent,
    }).then(() => {});

    // Upsert session via SECURITY DEFINER RPC (prevents cross-session overwrite)
    (supabase.rpc as any)("upsert_visitor_session", {
      p_session_id: sessionId,
      p_traffic_source: source,
      p_referrer: currentCount === 1 ? referrer : "",
      p_page_count: currentCount,
      p_is_bounce: currentCount === 1,
    }).then(() => {});
  }, [location.pathname]);
}
