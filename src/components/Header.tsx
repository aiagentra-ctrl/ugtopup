import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AccountDropdown } from "@/components/AccountDropdown";

export const Header = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/50">
      <div className="container mx-auto px-4">
        <div className="flex h-24 md:h-28 lg:h-32 items-center justify-between">
          <Link to="/" className="flex items-center py-2">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/10 blur-xl rounded-full" />
              <img 
                src="/logo.jpg" 
                alt="UG TOP-UP" 
                className="relative h-20 w-auto object-contain md:h-24 lg:h-28"
                loading="eager"
              />
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <AccountDropdown />
            ) : (
              <>
                <Link to="/login">
                  <Button 
                    className="neon-button h-10 px-6 font-medium"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button 
                    variant="outline"
                    className="h-10 px-6 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 font-medium"
                  >
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
