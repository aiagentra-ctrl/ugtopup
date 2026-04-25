import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Listens for PUSH_NAVIGATE messages from the service worker (sent on
 * notification tap when an app window is already open) and routes the
 * user inside the SPA without a hard reload.
 */
export const useServiceWorkerNavigation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handler = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== "PUSH_NAVIGATE") return;
      const target = (data.url as string) || "/";
      try {
        if (target.startsWith("http")) {
          window.location.href = target;
        } else {
          navigate(target.startsWith("/") ? target : `/${target}`);
        }
      } catch {
        window.location.href = target;
      }
    };

    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, [navigate]);
};
