import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DISMISS_KEY = "install_popup_dismissed";

/**
 * Re-trigger the install popup (e.g. after a top-up or successful purchase).
 * Clears the session-dismiss flag so the popup re-appears on next render.
 */
export const triggerInstallPopup = () => {
  try {
    sessionStorage.removeItem(DISMISS_KEY);
    window.dispatchEvent(new CustomEvent("install-popup-retrigger"));
  } catch {}
};

export const InstallAppPopup = () => {
  const { isInstallable, isInstalled, isIOS, isLoading, promptInstall } = usePWAInstall();
  const [visible, setVisible] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  const canShow = (isInstallable || isIOS) && !isInstalled;

  useEffect(() => {
    if (!canShow) return;

    const check = () => {
      const dismissed = sessionStorage.getItem(DISMISS_KEY) === "true";
      if (!dismissed) {
        const t = setTimeout(() => setVisible(true), 2500);
        return () => clearTimeout(t);
      }
    };

    const cleanup = check();
    const onRetrigger = () => check();
    window.addEventListener("install-popup-retrigger", onRetrigger);
    return () => {
      cleanup?.();
      window.removeEventListener("install-popup-retrigger", onRetrigger);
    };
  }, [canShow]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {}
    setVisible(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOS(true);
      return;
    }
    const result = await promptInstall();
    if (result === "accepted") {
      toast.success("Installing app! 🎉", { description: "Look for it on your home screen" });
      setVisible(false);
    } else if (result === "dismissed") {
      handleDismiss();
    }
  };

  if (!visible || !canShow) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-[9997] p-4 sm:p-6 pointer-events-none animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="mx-auto max-w-md pointer-events-auto rounded-2xl border border-border bg-card shadow-2xl p-4 relative">
          <button
            onClick={handleDismiss}
            aria-label="Close"
            className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted hover:bg-muted/70 flex items-center justify-center text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/30 to-purple-600/30 flex items-center justify-center shrink-0">
              <Download className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <span className="inline-block text-[10px] uppercase tracking-wider font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full mb-1">
                App Install
              </span>
              <h3 className="text-base font-bold text-foreground leading-tight">
                Install UGTOPUPS App
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Get instant access from your home screen with an app-like experience.
              </p>
            </div>
          </div>

          <Button
            onClick={handleInstall}
            disabled={isLoading}
            className="w-full mt-3 font-semibold"
          >
            {isLoading ? "Installing..." : "Install App"}
          </Button>
        </div>
      </div>

      <AlertDialog open={showIOS} onOpenChange={setShowIOS}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Install on iOS</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-left">
              <p className="font-semibold">To install on your iPhone or iPad:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Tap the <strong>Share</strong> button at the bottom of Safari</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong> to confirm</li>
              </ol>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
