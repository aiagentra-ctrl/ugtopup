import { ReactNode, useEffect as useEffectBridge, useState as useStateBridge, useState } from "react";
import {
  LayoutDashboard,
  CreditCard,
  ShoppingCart,
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
  Trophy,
  UserPlus,
  HeartPulse,
  MessageSquare,
  Megaphone,
  BarChart3,
  BookOpen,
  PieChart,
  Calculator,
  Sparkles,
  Activity,
  ChevronDown,
  Wrench,
  ShieldCheck,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CommandDialog as CmdDialog,
  CommandEmpty as CmdEmpty,
  CommandGroup as CmdGroup,
  CommandInput as CmdInput,
  CommandItem as CmdItem,
  CommandList as CmdList,
} from "@/components/ui/command";

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

type MenuItem = { id: string; title: string; icon: any };
type MenuGroup = { id: string; title: string; icon: any; items: MenuItem[] };

const groups: MenuGroup[] = [
  {
    id: "ai-command-group",
    title: "AI Command",
    icon: Sparkles,
    items: [
      { id: "ai-command", title: "AI Command", icon: Sparkles },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: BarChart3,
    items: [
      { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
      { id: "user-analytics", title: "User Analytics", icon: BarChart3 },
      { id: "profit-calculator", title: "Profit Calculator", icon: Calculator },
    ],
  },
  {
    id: "store",
    title: "Store",
    icon: Package,
    items: [
      { id: "game-pricing", title: "Products (New)", icon: Gamepad2 },
      { id: "products", title: "Products", icon: Package },
      { id: "product-update", title: "Product Update", icon: RefreshCw },
      { id: "categories", title: "Categories", icon: FolderOpen },
      { id: "offers", title: "Offers & Coupons", icon: Gift },
      { id: "vouchers", title: "Voucher Inventory", icon: Ticket },
      { id: "banners", title: "Banners", icon: ImageIcon },
    ],
  },
  {
    id: "orders",
    title: "Orders",
    icon: ShoppingCart,
    items: [
      { id: "orders", title: "Order Management", icon: ShoppingCart },
      { id: "chatbot-orders", title: "Chatbot Orders", icon: Bot },
      { id: "liana-orders", title: "ML API Orders", icon: Zap },
    ],
  },
  {
    id: "payments",
    title: "Payments & Credits",
    icon: CreditCard,
    items: [
      { id: "online-payments", title: "Sales Tracker", icon: CreditCard },
      { id: "payments", title: "Credit Requests", icon: CreditCard },
    ],
  },
  {
    id: "users",
    title: "Users",
    icon: Users,
    items: [
      { id: "users", title: "User Data", icon: Users },
      { id: "referrals", title: "Referrals & Rewards", icon: UserPlus },
    ],
  },
  {
    id: "ai",
    title: "AI & Chatbot",
    icon: Bot,
    items: [
      { id: "chatbot", title: "AI Chatbot", icon: Bot },
      { id: "knowledge-base", title: "Knowledge Base", icon: BookOpen },
      
    ],
  },
  {
    id: "comms",
    title: "Communications",
    icon: Megaphone,
    items: [
      { id: "notifications", title: "Notifications", icon: Bell },
      { id: "announcements", title: "Announcements", icon: Megaphone },
    ],
  },
  {
    id: "support",
    title: "Support",
    icon: MessageSquare,
    items: [
      { id: "tickets", title: "Support Tickets", icon: MessageSquare },
    ],
  },
  {
    id: "system",
    title: "System",
    icon: Wrench,
    items: [
      { id: "system-health", title: "System Health", icon: HeartPulse },
      { id: "db-management", title: "DB Management", icon: Database },
      { id: "ml-monitoring", title: "API Monitoring", icon: Activity },
      { id: "service-status", title: "Service Status", icon: HeartPulse },
    ],
  },
  {
    id: "developer",
    title: "Developer",
    icon: ShieldCheck,
    items: [
      { id: "chatbot-docs", title: "API Documentation", icon: BookOpen },
    ],
  },
];

const allItems: MenuItem[] = groups.flatMap((g) => g.items);

const bottomNavItems = [
  { id: "dashboard", title: "Home", icon: LayoutDashboard },
  { id: "orders", title: "Orders", icon: ShoppingCart },
  { id: "__search", title: "AI", icon: Sparkles },
  { id: "profit-calculator", title: "Profit", icon: Calculator },
  { id: "notifications", title: "Alerts", icon: Bell },
];

function findGroupOf(sectionId: string): string | undefined {
  return groups.find((g) => g.items.some((it) => it.id === sectionId))?.id;
}

function AdminSidebar({
  activeSection,
  onSectionChange,
  isMobile = false,
}: {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobile?: boolean;
}) {
  const { state } = useSidebar();
  const { user, profile, logout } = useAuth();
  const isCollapsed = !isMobile && state === "collapsed";
  const activeGroupId = findGroupOf(activeSection);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, g.id === activeGroupId || g.id === "analytics"]))
  );

  useEffectBridge(() => {
    if (activeGroupId) {
      setOpenGroups((prev) => ({ ...prev, [activeGroupId]: true }));
    }
  }, [activeGroupId]);

  const sidebarContent = (
    <>
      <div className="p-4 lg:p-6 border-b border-slate-800/50">
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

      <div className="flex-1 py-2 overflow-y-auto">
        <div className="px-2 space-y-1">
          {groups.map((group) => {
            const isGroupActive = group.items.some((it) => it.id === activeSection);
            const isOpen = !!openGroups[group.id];
            if (isCollapsed) {
              // Collapsed desktop: render flat list of items as icons
              return group.items.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    title={item.title}
                    className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                  </button>
                );
              });
            }
            return (
              <Collapsible
                key={group.id}
                open={isOpen}
                onOpenChange={(o) => setOpenGroups((p) => ({ ...p, [group.id]: o }))}
              >
                <CollapsibleTrigger
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
                    isGroupActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <group.icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{group.title}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-0.5 mt-0.5 mb-1">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onSectionChange(item.id)}
                        className={`w-full flex items-center gap-3 pl-9 pr-3 py-2 rounded-lg text-sm transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow shadow-primary/30 font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

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
          <Button variant="outline" size="sm" onClick={logout} className="w-full">
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
      <SidebarContent>{sidebarContent}</SidebarContent>
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
  const commandItems: AdminCommandItem[] = allItems.map((m) => ({
    id: m.id,
    title: m.title,
    group: findGroupOf(m.id) ? groups.find((g) => g.id === findGroupOf(m.id))!.title : "Navigation",
  }));
  const openSearch = () => window.dispatchEvent(new CustomEvent("admin:open-search"));
  const activeTitle = allItems.find((i) => i.id === activeSection)?.title || "Dashboard";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <div className="hidden lg:block">
          <AdminSidebar activeSection={activeSection} onSectionChange={onSectionChange} />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 lg:h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center gap-2 px-3 lg:px-6 sticky top-0 z-10 shadow-sm">
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

            <SidebarTrigger className="hidden lg:flex mr-2" />

            <div className="flex-1 min-w-0">
              <h1 className="text-base lg:text-xl font-bold text-foreground truncate">
                {activeTitle}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Manage your gaming store operations
              </p>
            </div>

            <AdminCommandBar items={commandItems} onSelect={onSectionChange} />
          </header>

          <main className="flex-1 p-3 lg:p-6 overflow-auto pb-24 lg:pb-6">{children}</main>
        </div>

        <MobileBottomNav
          activeSection={activeSection}
          onSectionChange={onSectionChange}
          onOpenSearch={openSearch}
        />

        <MobileSearchHost items={commandItems} onSelect={onSectionChange} />
      </div>
    </SidebarProvider>
  );
}

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
      <CmdInput placeholder="Jump to a section…" />
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
