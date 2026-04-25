import { Smartphone, Zap, Bell, Shield, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";

export const AppCTASection = () => {
  const { isInstallable, isInstalled, isLoading, promptInstall } = usePWAInstall();

  const onInstall = async () => {
    const r = await promptInstall();
    if (r === "accepted") toast.success("App installed — launching IG Arena!");
    else if (r === "dismissed") toast.info("You can install anytime from your browser menu");
    else toast.info("Add to Home Screen via your browser menu to install");
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-arena-mesh animate-bg-pan p-6 sm:p-8">
      <span className="orb orb-primary right-[-40px] top-[-30px] h-40 w-40 animate-float" />
      <span className="orb orb-secondary left-[-30px] bottom-[-30px] h-40 w-40 animate-float-slow" />
      <div className="relative grid items-center gap-6 sm:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
            <Smartphone className="h-3 w-3" /> Install IG Arena
          </div>
          <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight sm:text-3xl">
            Faster matches.<br /><span className="text-gradient-primary">Instant alerts.</span>
          </h2>
          <p className="mt-2 text-[13px] text-muted-foreground">
            Add IG Arena to your home screen for one-tap access, push notifications when your matches start, and offline-ready browsing.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={onInstall} disabled={isInstalled || isLoading} size="lg" className="btn-glow gap-2">
              <Download className="h-4 w-4" />
              {isInstalled ? "Installed" : isLoading ? "Installing…" : isInstallable ? "Install app" : "How to install"}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Zap,    label: "Quick join" },
            { icon: Bell,   label: "Match alerts" },
            { icon: Shield, label: "Safe payouts" },
          ].map(({ icon: I, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card/70 p-3 backdrop-blur">
              <I className="h-5 w-5 text-primary" />
              <span className="text-[11px] font-medium text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
