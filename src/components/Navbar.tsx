import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Plus, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ugGamingLogo from "@/assets/ug-gaming-logo.jpg";

export const Navbar = () => {
  const [walletBalance] = useState(0);

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center py-2">
            <img 
              src={ugGamingLogo} 
              alt="UG GAMING" 
              className="h-18 w-auto object-contain md:h-24"
              loading="eager"
            />
          </Link>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Wallet */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2">
              <Wallet className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{walletBalance} Cr.</span>
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <Plus className="h-4 w-4 text-secondary" />
              </Button>
            </div>

            {/* Login Button */}
            <Link to="/auth">
              <Button 
                className="bg-gradient-to-r from-red-500 to-rose-400 hover:from-red-600 hover:to-rose-500 text-white font-medium rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/30"
              >
                Login
              </Button>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Wallet className="mr-2 h-4 w-4" />
                  Wallet
                </DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Button variant="ghost" size="icon" className="sm:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
