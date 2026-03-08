import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium transition-all duration-300 ${
        isOnline
          ? "bg-green-600 text-white"
          : "bg-destructive text-destructive-foreground"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Back online — syncing data…</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>You're offline — showing cached data</span>
        </>
      )}
    </div>
  );
};
