import { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Swords, Plus, Gamepad2, Wallet, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/tournaments", label: "Play", icon: Swords, end: true },
  { to: "/tournaments/create", label: "Create", icon: Plus },
  { to: "/tournaments/my-games", label: "My Games", icon: Gamepad2 },
  { to: "/tournaments/wallet", label: "Wallet", icon: Wallet },
];

export const TournamentsLayout = ({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Premium glassmorphic sub-nav */}
      <div className="sticky top-0 z-30 border-b border-primary/10 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="container mx-auto max-w-6xl px-3 sm:px-4">
          <div className="flex items-center gap-2 py-2.5">
            <Link
              to="/dashboard"
              className="hidden shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-muted/40 hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="-mx-1 flex-1 overflow-x-auto scrollbar-hide [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%-24px),transparent)]">
              <div className="flex w-max gap-1 px-1">
                {navItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all",
                        isActive
                          ? "nav-pill-active border-primary/50 bg-primary/15 text-primary shadow-[0_0_18px_-4px_hsl(var(--primary)/0.6)]"
                          : "border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                      )
                    }
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8 animate-fade-in">
        {(title || actions) && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            {title && (
              <div>
                <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                  <span className="text-gradient-primary">{title}</span>
                </h1>
                {subtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
            )}
            {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>

      <Footer />
    </div>
  );
};
