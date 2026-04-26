import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface Window {
    __deferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

/**
 * Swap the active manifest to the admin one (or back to user) and force
 * the browser to re-evaluate installability. Returns true if the manifest
 * was actually changed.
 */
export const swapManifest = (admin: boolean): boolean => {
  const target = admin ? '/manifest-admin.json' : '/manifest.json';
  const head = document.head;
  const existing = head.querySelector<HTMLLinkElement>('link[rel="manifest"]');

  // If already set to the right manifest, nothing to do.
  if (existing && existing.getAttribute('href') === target) return false;

  // Remove and re-create the link so Chrome re-fetches the manifest and
  // refires `beforeinstallprompt` for the new app identity.
  if (existing) existing.remove();
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = target;
  head.appendChild(link);
  return true;
};

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => window.__deferredInstallPrompt ?? null
  );
  const [isInstallable, setIsInstallable] = useState(!!window.__deferredInstallPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isIOS = useCallback(() => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  }, []);

  const isStandalone = useCallback(() => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }, []);

  useEffect(() => {
    if (isStandalone()) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      window.__deferredInstallPrompt = e;
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      window.__deferredInstallPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const promptInstall = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const prompt = deferredPrompt ?? window.__deferredInstallPrompt;
    if (!prompt) return 'unavailable';

    setIsLoading(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setDeferredPrompt(null);
      window.__deferredInstallPrompt = null;
      setIsInstallable(false);
      return choice.outcome;
    } catch {
      return 'unavailable';
    } finally {
      setIsLoading(false);
    }
  }, [deferredPrompt]);

  return {
    isInstallable: isInstallable && !isIOS() && !isInstalled,
    isInstalled,
    isLoading,
    promptInstall,
    isIOS: isIOS(),
    isStandalone: isStandalone(),
  };
};
