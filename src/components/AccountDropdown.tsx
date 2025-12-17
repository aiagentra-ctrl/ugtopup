import { User, LayoutDashboard, LogOut, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const AccountDropdown = () => {
  const { user, logout } = useAuth();
  const { unreadCount } = useUnreadNotifications();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 hover:bg-muted transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-red-500 to-rose-400 flex items-center justify-center text-white font-semibold text-sm">
            {user?.email.charAt(0).toUpperCase()}
          </div>
          <span className="hidden sm:inline text-foreground font-medium">
            Account
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56 bg-popover backdrop-blur-lg border-border animate-scale-in"
      >
        <div className="px-3 py-2">
          <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/notifications" className="cursor-pointer flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/account" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={logout}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
