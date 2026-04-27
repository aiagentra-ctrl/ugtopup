import { ReactNode, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  LayoutDashboard, Swords, Plus, Gamepad2, Activity, Crown, Wallet, History, Flag,
  ArrowLeft, Menu, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/tournaments", label: "Hub", icon: LayoutDashboard, end: true },
  { to: "/tournaments/join", label: "Join", icon: Swords },
  { to: "/tournaments/create", label: "Create", icon: Plus },
  { to: "/tournaments/my-games", label: "My Games", icon: Gamepad2 },
  { to: "/tournaments/live", label: "Live", icon: Activity },
  { to: "/tournaments/leaderboard", label: "Leaderboard", icon: Crown },
  { to: "/tournaments/wallet", label: "Wallet", icon: Wallet },
  { to: "/tournaments/history", label: "History", icon: History },
  { to: "/tournaments/reports", label: "Reports", icon: Flag },
];

// 5-slot bottom nav — the most-used destinations only
const bottomNavItems = [
  { to: "/tournaments", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/tournaments/live", label: "Live", icon: Activity },
  { to: "/tournaments/my-games", label: "Games", icon: Gamepad2 },
  { to: "/tournaments/wallet", label: "Wallet", icon: Wallet },
  { to: "/tournaments/leaderboard", label: "Top", icon: Crown },
];

export const TournamentsLayout = ({
  title,
  subtitle,
  actions,
  children,
  minimal = false,
}: {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  /** When true, hides the busy sub-nav and shows just a slim back + menu bar. */
  minimal?: boolean;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-24">
      <Header />

      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-primary/10 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="container mx-auto max-w-6xl px-3 sm:px-4">
          {minimal ? (
            <div className="flex items-center justify-between py-2.5">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
              </Link>
              <div className="font-display text-[13px] font-bold uppercase tracking-[0.2em] text-primary">
                Arena
              </div>
              <button
                onClick={() => setMenuOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" /> Menu
              </button>
            </div>
          ) : (
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
          )}
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

      {/* Premium bottom nav (always visible inside Tournaments) */}
      <nav
        aria-label="Tournament navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/15 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
      >
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="container mx-auto max-w-6xl px-2">
          <div className="grid grid-cols-5">
            {bottomNavItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "group relative flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                        isActive
                          ? "bg-primary/15 text-primary shadow-[0_0_18px_-4px_hsl(var(--primary)/0.7)] ring-1 ring-primary/40"
                          : "text-muted-foreground group-hover:bg-muted/40"
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="leading-none tracking-wide">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
          <div className="h-[env(safe-area-inset-bottom)]" />
        </div>
      </nav>

      {/* Slide-down full menu (minimal mode) */}
      {minimal && menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md animate-fade-in"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute inset-x-3 top-3 rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-2xl sm:inset-x-auto sm:right-4 sm:w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="font-display text-sm font-bold uppercase tracking-[0.18em] text-primary">
                Arena Menu
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[13px] font-semibold transition-all",
                      isActive
                        ? "border-primary/50 bg-primary/15 text-primary"
                        : "border-border/60 bg-muted/20 text-foreground hover:border-primary/30 hover:bg-muted/40"
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
