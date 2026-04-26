import { useState } from "react";
import { useTournamentBanners } from "@/hooks/useTournamentBanners";
import { AlertTriangle, Info, CheckCircle2, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

const variantStyles: Record<string, { wrap: string; icon: any; iconClass: string }> = {
  warning: {
    wrap: "border-amber-500/30 bg-amber-500/10 text-amber-100",
    icon: AlertTriangle,
    iconClass: "text-amber-400",
  },
  info: {
    wrap: "border-primary/30 bg-primary/10 text-foreground",
    icon: Info,
    iconClass: "text-primary",
  },
  success: {
    wrap: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
    icon: CheckCircle2,
    iconClass: "text-emerald-400",
  },
  promo: {
    wrap: "border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-500/15 via-primary/10 to-cyan-500/15 text-foreground",
    icon: Sparkles,
    iconClass: "text-fuchsia-400",
  },
};

export const TournamentBannerStrip = () => {
  const { banners } = useTournamentBanners();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = banners.filter((b) => !dismissed.includes(b.id));
  if (visible.length === 0) return null;

  return (
    <div className="mb-5 space-y-2">
      {visible.map((b) => {
        const style = variantStyles[b.variant] || variantStyles.info;
        const Icon = style.icon;
        return (
          <div
            key={b.id}
            className={cn(
              "relative flex items-start gap-3 overflow-hidden rounded-xl border p-3 sm:p-4 backdrop-blur-md animate-fade-in",
              style.wrap
            )}
          >
            {b.image_url && (
              <img
                src={b.image_url}
                alt={b.title || "Banner"}
                className="hidden h-14 w-14 shrink-0 rounded-lg object-cover sm:block"
              />
            )}
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", style.iconClass)} />
            <div className="min-w-0 flex-1">
              {b.title && <div className="text-sm font-semibold leading-tight">{b.title}</div>}
              <p className="text-sm leading-snug opacity-90">{b.message}</p>
              {b.cta_text && b.cta_link && (
                <a
                  href={b.cta_link}
                  target={b.cta_link.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="mt-1.5 inline-flex text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                >
                  {b.cta_text}
                </a>
              )}
            </div>
            <button
              onClick={() => setDismissed((d) => [...d, b.id])}
              className="shrink-0 rounded-md p-1 opacity-60 hover:bg-foreground/10 hover:opacity-100"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
