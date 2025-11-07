import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CreditCard,
  ShoppingCart,
  Activity,
  Menu,
  LogOut,
  User,
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

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const menuItems = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
  { id: "payments", title: "Credit Requests", icon: CreditCard },
  { id: "orders", title: "Order Management", icon: ShoppingCart },
  { id: "activity", title: "Activity Logs", icon: Activity },
];

function AdminSidebar({ activeSection, onSectionChange }: { activeSection: string; onSectionChange: (section: string) => void }) {
  const { state } = useSidebar();
  const { user, profile, logout } = useAuth();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className="border-r bg-slate-900 text-slate-100">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg">Admin Panel</h2>
                <p className="text-xs text-slate-400">Gaming Store</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-400 px-6">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onSectionChange(item.id)}
                      className={`
                        px-6 py-3 w-full transition-all duration-200
                        ${isActive 
                          ? "bg-blue-600 text-white hover:bg-blue-700" 
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5 mr-3" />
                      {!isCollapsed && <span className="font-medium">{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Profile Section */}
        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-blue-600 text-white">
                {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "A"}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile?.username || user?.email?.split("@")[0]}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export function AdminLayout({ children, activeSection, onSectionChange }: AdminLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50">
        <AdminSidebar activeSection={activeSection} onSectionChange={onSectionChange} />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header Bar */}
          <header className="h-16 border-b bg-white flex items-center px-6 sticky top-0 z-10 shadow-sm">
            <SidebarTrigger className="mr-4">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {menuItems.find(item => item.id === activeSection)?.title || "Dashboard"}
              </h1>
              <p className="text-xs text-slate-500">Manage your gaming store operations</p>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
