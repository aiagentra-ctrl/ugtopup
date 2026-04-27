import { ReactNode } from "react";
import {
  LayoutDashboard,
  CreditCard,
  ShoppingCart,
  Activity,
  Package,
  Menu,
  LogOut,
  Users,
  Database,
  Gamepad2,
  Bell,
  ImageIcon,
  Zap,
  RefreshCw,
  FolderOpen,
  Gift,
  Bot,
  Ticket,
  Smartphone,
  Trophy,
  UserPlus,
  HeartPulse,
  MessageSquare,
  Megaphone,
  BarChart3,
  Wrench,
  BookOpen,
  ThumbsUp,
  PieChart,
  Calculator,
  Sparkles,
} from "lucide-react";
import { AdminCommandBar, type AdminCommandItem } from "./AdminCommandBar";
import {
  Sidebar,
  SidebarContent,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
  { id: "profit-calculator", title: "Profit Calculator", icon: Calculator },
  { id: "tournaments-hub", title: "Tournaments", icon: Trophy },
  { id: "tournament-banners", title: "Tournament Banners", icon: ImageIcon },
  { id: "online-payments", title: "Online Payments", icon: CreditCard },
  { id: "payments", title: "Credit Requests", icon: CreditCard },
  { id: "orders", title: "Order Management", icon: ShoppingCart },
  { id: "liana-orders", title: "ML API Orders", icon: Zap },
  { id: "products", title: "Products", icon: Package },
  { id: "game-pricing", title: "Products (New)", icon: Gamepad2 },
  { id: "banners", title: "Banner", icon: ImageIcon },
  { id: "notifications", title: "Notifications", icon: Bell },
  { id: "users", title: "User Data", icon: Users },
  { id: "activity", title: "Activity Logs", icon: Activity },
  { id: "supabase-limits", title: "Supabase Limits", icon: Database },
  { id: "product-update", title: "Product Update", icon: RefreshCw },
  { id: "page-descriptions", title: "Page Descriptions", icon: BookOpen },
  { id: "categories", title: "Categories", icon: FolderOpen },
  { id: "offers", title: "Offers", icon: Gift },
  { id: "chatbot", title: "AI Chatbot", icon: Bot },
  { id: "knowledge-base", title: "Knowledge Base", icon: BookOpen },
  { id: "chat-feedback", title: "Chat Feedback", icon: ThumbsUp },
  { id: "chatbot-docs", title: "API Documentation", icon: Bot },
  { id: "vouchers", title: "Voucher Inventory", icon: Ticket },
  { id: "ml-monitoring", title: "API Monitoring", icon: Activity },
  { id: "admin-app", title: "Admin App", icon: Smartphone },
  { id: "milestones", title: "Reward Milestones", icon: Trophy },
  { id: "referrals", title: "Referral Program", icon: UserPlus },
  { id: "coupon-rules", title: "Coupon Rules", icon: Ticket },
  { id: "promo-analytics", title: "Promo Analytics", icon: Activity },
  { id: "chatbot-orders", title: "Chatbot Orders", icon: Bot },
  { id: "service-status", title: "Service Status", icon: HeartPulse },
  { id: "tickets", title: "Support Tickets", icon: MessageSquare },
  { id: "announcements", title: "Announcements", icon: Megaphone },
  { id: "user-analytics", title: "User Analytics", icon: BarChart3 },
  { id: "maintenance-log", title: "Maintenance Log", icon: Wrench },
  { id: "system-health", title: "System Health", icon: HeartPulse },
  { id: "db-management", title: "DB Management", icon: Database },
  { id: "advanced-analytics", title: "Advanced Analytics", icon: PieChart },
  { id: "whatsapp", title: "WhatsApp Chatbot", icon: MessageSquare },
];

// Bottom nav items for mobile quick access
const bottomNavItems = [
  { id: "dashboard", title: "Home", icon: LayoutDashboard },
  { id: "orders", title: "Orders", icon: ShoppingCart },
  { id: "__search", title: "Search", icon: Sparkles },
  { id: "profit-calculator", title: "Profit", icon: Calculator },
  { id: "notifications", title: "Alerts", icon: Bell },
];

function AdminSidebar({ 
  activeSection, 
  onSectionChange,
  isMobile = false 
}: { 
  activeSection: string; 
  onSectionChange: (section: string) => void;
  isMobile?: boolean;
}) {
  const { state } = useSidebar();
  const { user, profile, logout } = useAuth();
  const isCollapsed = !isMobile && state === "collapsed";

  const sidebarContent = (
    <>
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/80 to-secondary/80 flex items-center justify-center shadow-lg shadow-primary/30">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg text-foreground">Admin Panel</h2>
              <p className="text-xs text-muted-foreground">Gaming Store</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-4 overflow-y-auto">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold tracking-tight text-muted-foreground">
            Navigation
          </h2>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 font-medium
                    ${isActive 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }
                  `}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.title}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="mt-auto p-4 border-t border-slate-800/50 bg-card/50">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary-foreground">
              {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {profile?.username || user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </div>
        {!isCollapsed && (
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return <div className="flex flex-col h-full bg-slate-950">{sidebarContent}</div>;
  }

  return (
    <Sidebar className="border-r border-slate-800/50 bg-slate-950">
      <SidebarContent>
        {sidebarContent}
      </SidebarContent>
    </Sidebar>
  );
}

function MobileBottomNav({
  activeSection,
  onSectionChange,
  onOpenSearch,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  onOpenSearch: () => void;
}) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-1">
        {bottomNavItems.map((item) => {
          const isSearch = item.id === "__search";
          const isActive = !isSearch && activeSection === item.id;
          if (isSearch) {
            return (
              <button
                key={item.id}
                onClick={onOpenSearch}
                className="flex flex-col items-center justify-center -mt-6 h-14 w-14 rounded-full bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-lg shadow-primary/40 active:scale-95 transition-transform"
                aria-label="AI search"
              >
                <item.icon className="h-6 w-6" />
              </button>
            );
          }
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-h-[44px] transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.title}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function AdminLayout({ children, activeSection, onSectionChange }: AdminLayoutProps) {
  const commandItems: AdminCommandItem[] = menuItems.map((m) => ({
    id: m.id,
    title: m.title,
    group: "Navigation",
  }));
  // Imperative trigger for the AI search via custom event (keeps layout simple)
  const openSearch = () => window.dispatchEvent(new CustomEvent("admin:open-search"));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar activeSection={activeSection} onSectionChange={onSectionChange} />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="h-14 lg:h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center gap-2 px-3 lg:px-6 sticky top-0 z-10 shadow-sm">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 bg-slate-950 border-slate-800">
                <AdminSidebar
                  activeSection={activeSection}
                  onSectionChange={onSectionChange}
                  isMobile
                />
              </SheetContent>
            </Sheet>

            {/* Desktop Sidebar Trigger */}
            <SidebarTrigger className="hidden lg:flex mr-2" />

            <div className="flex-1 min-w-0">
              <h1 className="text-base lg:text-xl font-bold text-foreground truncate">
                {menuItems.find((item) => item.id === activeSection)?.title || "Dashboard"}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Manage your gaming store operations
              </p>
            </div>

            {/* Desktop search trigger */}
            <AdminCommandBar items={commandItems} onSelect={onSectionChange} />
          </header>

          {/* Main Content */}
          <main className="flex-1 p-3 lg:p-6 overflow-auto pb-24 lg:pb-6">{children}</main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onOpenSearch={openSearch}
        />

        {/* Mobile-only command bar listener */}
        <MobileSearchHost items={commandItems} onSelect={onSectionChange} />
      </div>
    </SidebarProvider>
  );
}

// Listens for the bottom-nav search button event and opens the dialog.
function MobileSearchHost({
  items,
  onSelect,
}: {
  items: AdminCommandItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="lg:hidden">
      <AdminCommandBarBridge items={items} onSelect={onSelect} />
    </div>
  );
}

import { useEffect as useEffectBridge, useState as useStateBridge } from "react";
import {
  CommandDialog as CmdDialog,
  CommandEmpty as CmdEmpty,
  CommandGroup as CmdGroup,
  CommandInput as CmdInput,
  CommandItem as CmdItem,
  CommandList as CmdList,
} from "@/components/ui/command";

function AdminCommandBarBridge({
  items,
  onSelect,
}: {
  items: AdminCommandItem[];
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useStateBridge(false);
  useEffectBridge(() => {
    const h = () => setOpen(true);
    window.addEventListener("admin:open-search", h);
    return () => window.removeEventListener("admin:open-search", h);
  }, []);
  return (
    <CmdDialog open={open} onOpenChange={setOpen}>
      <CmdInput placeholder="Ask AI or jump to a section…" />
      <CmdList>
        <CmdEmpty>No matches.</CmdEmpty>
        <CmdGroup heading="Navigation">
          {items.map((it) => (
            <CmdItem
              key={it.id}
              value={it.title}
              onSelect={() => {
                setOpen(false);
                onSelect(it.id);
              }}
            >
              {it.title}
            </CmdItem>
          ))}
        </CmdGroup>
      </CmdList>
    </CmdDialog>
  );
}

