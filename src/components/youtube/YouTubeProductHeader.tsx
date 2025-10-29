import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AccountDropdown } from "@/components/AccountDropdown";
import { useAuth } from "@/contexts/AuthContext";
import productYoutube from "@/assets/product-youtube.jpg";

export const YouTubeProductHeader = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  return (
    <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <img 
              src={productYoutube} 
              alt="YouTube Premium" 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold">YouTube Premium</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                YouTube Premium Subscription
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Credits</div>
              <div className="text-sm sm:text-base font-bold text-primary">
                ₹{profile?.credits?.toLocaleString() || "0"}
              </div>
            </div>
            <AccountDropdown />
          </div>
        </div>
      </div>
    </div>
  );
};
