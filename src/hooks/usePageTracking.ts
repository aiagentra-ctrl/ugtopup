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
    } catch {}
  }

  return { source: "direct", referrer: "" };
}

export function usePageTracking() {
  const location = useLocation();
  const isFirstLoad = useRef(true);
  const trafficInfo = useRef(detectTrafficSource());

  useEffect(() => {
    const sessionId = getSessionId();
    const { source, referrer } = trafficInfo.current;

    // Record page view
    supabase.from("page_views").insert({
      session_id: sessionId,
      page_path: location.pathname,
      page_title: document.title,
      referrer: isFirstLoad.current ? referrer : "",
      traffic_source: source,
      user_agent: navigator.userAgent,
    }).then(() => {});

    if (isFirstLoad.current) {
      // Create session
      supabase.from("visitor_sessions").upsert(
        {
          session_id: sessionId,
          traffic_source: source,
          referrer,
          page_count: 1,
          is_bounce: true,
          last_active_at: new Date().toISOString(),
        },
        { onConflict: "session_id" }
      ).then(() => {});
      isFirstLoad.current = false;
    } else {
      // Update session: increment page count, mark not bounce
      supabase.rpc("increment_session_page_count" as any, { p_session_id: sessionId }).then(() => {});
      // Fallback: direct update
      supabase
        .from("visitor_sessions")
        .update({
          page_count: undefined, // handled by rpc ideally
          is_bounce: false,
          last_active_at: new Date().toISOString(),
        })
        .eq("session_id", sessionId)
        .then(() => {});
    }
  }, [location.pathname]);
}
