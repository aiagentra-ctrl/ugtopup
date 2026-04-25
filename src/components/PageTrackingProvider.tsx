import { useServiceWorkerNavigation } from "@/hooks/useServiceWorkerNavigation";

export function PageTrackingProvider({ children }: { children: React.ReactNode }) {
  // Listen for service-worker push-notification taps and route inside the SPA
  useServiceWorkerNavigation();
  return <>{children}</>;
}
