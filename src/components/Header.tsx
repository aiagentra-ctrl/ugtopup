import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Menu, Plus } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import downloadIcon from "@/assets/download-icon-new.png";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TopUpModal } from "./topup/TopUpModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import ugGamingLogo from "@/assets/ug-gaming-logo.jpg";

export const Header = () => {
  const { isAuthenticated, profile, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [balance, setBalance] = useState(profile?.balance || 0);
  const { isInstallable, promptInstall, isIOS, isInstalled, isLoading } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const handleInstallClick = async () => {
    // Already installed
    if (isInstalled) {
      toast.success('App is already installed! Check your home screen 📱', {
        description: 'UGTOPUPS is ready to use'
      });
      setMobileMenuOpen(false);
      return;
    }

    // iOS devices - show instructions
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Android/Desktop with install prompt available
    if (isInstallable) {
      toast.loading('Preparing download...', { id: 'pwa-install' });
      
      const result = await promptInstall();
      
      if (result === 'accepted') {
        toast.success('Download started! 🎉', {
          id: 'pwa-install',
          description: 'Find UGTOPUPS on your home screen'
        });
        setMobileMenuOpen(false);
      } else if (result === 'dismissed') {
        toast.info('Download cancelled', {
          id: 'pwa-install',
          description: 'You can install later from browser menu'
        });
      } else {
        toast.error('Download unavailable', {
          id: 'pwa-install',
          description: 'Please try again or use browser menu to install'
        });
      }
      return;
    }

    // Fallback for browsers without PWA support or prompt not ready
    toast.info('Install from browser menu', {
      description: 'Use your browser\'s "Add to Home Screen" or "Install App" option',
      duration: 5000
    });
    setMobileMenuOpen(false);
  };

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
              src={ugGamingLogo} 
              alt="UG GAMING" 
              className="h-10 md:h-12 w-auto object-contain"
              loading="eager"
            />
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Credit Balance - Visible on all devices */}
                <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2">
                  <span className="text-xs sm:text-sm font-semibold text-white">
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

      {/* Navigation Menu - Shows on all devices */}
      {mobileMenuOpen && (
        <div className="border-t border-white/5 bg-black">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <div className="mb-4 p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={downloadIcon} alt="Download" className="h-8 w-8 object-contain" />
                  <div>
                    <h3 className="text-white font-bold text-base">Download the App</h3>
                    <p className="text-white/80 text-xs">Install UGTOPUPS on your device</p>
                  </div>
                </div>
                <Button
                  onClick={handleInstallClick}
                  className="bg-white text-purple-600 hover:bg-white/90 font-bold px-4 py-2 rounded-lg text-sm"
                >
                  Install
                </Button>
              </div>
            </div>
            
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-white">
                Home
              </Button>
            </Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-white">
                Contact Us
              </Button>
            </Link>
            <Link to="/refund-policy" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-white">
                Refund & Payment Policy
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Top-Up Modal */}
      <TopUpModal 
        open={topUpModalOpen}
        onOpenChange={setTopUpModalOpen}
        onSuccess={() => setTopUpModalOpen(false)}
      />

      {/* iOS Installation Instructions Modal */}
      <AlertDialog open={showIOSModal} onOpenChange={setShowIOSModal}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100 text-xl">Install UGTOPUPS on iOS</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300 space-y-3 text-left">
              <p className="font-semibold">To install this app on your iPhone or iPad:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Tap the <strong>Share</strong> button at the bottom of Safari</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
                <li>Tap <strong>Add</strong> to confirm</li>
              </ol>
              <p className="mt-4 text-sm">The UGTOPUPS icon will appear on your home screen!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};
