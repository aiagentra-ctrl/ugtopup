import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// === Admin App separation ===
// 1) Swap to admin manifest when user is browsing the admin area, so the
//    "Install App" prompt captures the admin start_url and name.
// 2) When launched as an installed PWA whose start_url is the admin route,
//    force the hash to /admin so the user lands directly on the admin login/panel.
import { swapManifest } from "./hooks/usePWAInstall";

try {
  const isAdminPath = () => (window.location.hash || '').startsWith('#/admin');

  // Initial swap
  swapManifest(isAdminPath());
  // React to in-app navigation (HashRouter triggers hashchange)
  window.addEventListener('hashchange', () => swapManifest(isAdminPath()));

  // Standalone (installed PWA) auto-redirect to admin if installed from /admin
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  if (isStandalone) {
    const launchedFromAdmin =
      isAdminPath() ||
      document.referrer.includes('/admin') ||
      localStorage.getItem('installed_as_admin_app') === 'true';

    if (launchedFromAdmin && !isAdminPath()) {
      window.location.hash = '#/admin';
    }
  }
} catch {}

createRoot(document.getElementById("root")!).render(<App />);
