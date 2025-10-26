import { useAuth } from "@/contexts/AuthContext";
import { AccountDropdown } from "@/components/AccountDropdown";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

export const TikTokProductHeader = () => {
  const { user, profile } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-[#FE2C55] to-[#25F4EE] flex items-center justify-center">
                <span className="text-3xl">🎵</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">TikTok Coins</h1>
                <p className="text-xs text-muted-foreground">TikTok Coin Top-Up</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border">
                <span className="text-sm text-muted-foreground">Credits:</span>
                <span className="text-lg font-bold text-primary">{profile?.balance || 0}💵</span>
              </div>
            )}
            <AccountDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};
