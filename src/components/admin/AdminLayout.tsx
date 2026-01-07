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
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
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
  { id: "payments", title: "Credit Requests", icon: CreditCard },
  { id: "orders", title: "Order Management", icon: ShoppingCart },
  { id: "products", title: "Products", icon: Package },
  { id: "game-pricing", title: "Products (New)", icon: Gamepad2 },
  { id: "banners", title: "Banner", icon: ImageIcon },
  { id: "notifications", title: "Notifications", icon: Bell },
  { id: "users", title: "User Data", icon: Users },
  { id: "activity", title: "Activity Logs", icon: Activity },
  { id: "supabase-limits", title: "Supabase Limits", icon: Database },
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
      <div className="flex-1 py-4">
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

export function AdminLayout({ children, activeSection, onSectionChange }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <AdminSidebar activeSection={activeSection} onSectionChange={onSectionChange} />
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-lg flex items-center px-4 lg:px-6 sticky top-0 z-10 shadow-sm">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild className="lg:hidden mr-4">
                <Button variant="ghost" size="icon">
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
            <SidebarTrigger className="hidden lg:flex mr-4" />

            <div className="flex-1 min-w-0">
              <h1 className="text-lg lg:text-xl font-bold text-foreground truncate">
                {menuItems.find(item => item.id === activeSection)?.title || "Dashboard"}
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Manage your gaming store operations</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
