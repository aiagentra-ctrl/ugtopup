import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { TopUpModal } from "./topup/TopUpModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

export const Header = () => {
  const { isAuthenticated, profile, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [balance, setBalance] = useState(profile?.balance || 0);

  // Real-time balance updates
  useEffect(() => {
    if (!user?.id) return;

    // Set initial balance from profile
    if (profile?.balance !== undefined) {
      setBalance(profile.balance);
    }

    // Subscribe to real-time balance changes
    const channel = supabase
      .channel('header-balance-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Header] Balance updated:', payload.new.balance);
          setBalance(payload.new.balance);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.balance]);

  return (
    <header className="sticky top-0 z-50 bg-black border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex h-16 md:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center py-2">
            <img 
              src="https://i.ibb.co/JR0CQPpN/SAVE-20251108-175711.jpg" 
              alt="UG TOP-UP" 
              className="h-14 md:h-20 w-auto object-contain"
              loading="eager"
            />
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Credit Balance - Desktop only */}
                <div className="hidden sm:flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-4 py-2">
                  <span className="text-sm font-semibold text-white">
                    {balance || 0} Cr.
                  </span>
                </div>

                {/* Add Credit Button */}
                <Button
                  size="icon"
                  className="neon-button h-10 w-10 rounded-xl"
                  onClick={() => setTopUpModalOpen(true)}
                >
                  <Plus className="h-5 w-5" />
                </Button>

                {/* User Profile Dropdown - Desktop */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden sm:flex items-center gap-2 bg-black border border-white/10 rounded-xl px-3 py-2 hover:border-primary/50 transition-colors">
                      <span className="text-sm font-medium text-white max-w-[100px] truncate">
                        {profile?.username || user?.email?.split('@')[0]}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-black border-white/10">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="cursor-pointer">
                        Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User Profile Icon - Mobile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="sm:hidden flex items-center justify-center h-10 w-10 bg-black border border-white/10 rounded-xl hover:border-primary/50 transition-colors">
                      <span className="text-sm font-medium text-white">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-black border-white/10">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="cursor-pointer">
                        Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={logout} className="cursor-pointer">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Login Button */}
                <Link to="/login">
                  <Button 
                    className="neon-button h-10 px-6 rounded-xl font-bold text-white"
                  >
                    Login
                  </Button>
                </Link>
              </>
            )}

            {/* Hamburger Menu for Navigation */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white/60 hover:text-white hover:bg-white/5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-white/5 bg-black">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-white">
                Home
              </Button>
            </Link>
            {/* Add more navigation links here as needed */}
          </div>
        </div>
      )}

      {/* Top-Up Modal */}
      <TopUpModal 
        open={topUpModalOpen}
        onOpenChange={setTopUpModalOpen}
        onSuccess={() => setTopUpModalOpen(false)}
      />
    </header>
  );
};
