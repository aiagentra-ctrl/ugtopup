import { ReactNode } from "react";
import { NavLink, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  LayoutDashboard, Swords, Plus, Gamepad2, Activity, Crown, Wallet, History, Flag, ArrowLeft,
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

      {/* Sticky sub-nav */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container mx-auto max-w-6xl px-3 sm:px-4">
          <div className="flex items-center gap-2 py-2">
            <Link
              to="/dashboard"
              className="hidden shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[12px] text-muted-foreground hover:bg-muted/40 hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
            </Link>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <div className="-mx-1 flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex w-max gap-1 px-1">
                {navItems.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors",
                        isActive
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground"
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

      <main className="container mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">
        {(title || actions) && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            {title && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
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
