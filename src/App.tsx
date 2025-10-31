import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ChatWidget } from "./components/chat/ChatWidget";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Account from "./pages/Account";
import FreefireDiamond from "./pages/FreefireDiamond";
import TikTokCoins from "./pages/TikTokCoins";
import UnipinUC from "./pages/UnipinUC";
import SmileCoin from "./pages/SmileCoin";
import ChatGPT from "./pages/ChatGPT";
import YouTube from "./pages/YouTube";
import Netflix from "./pages/Netflix";
import GarenaShell from "./pages/GarenaShell";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/product/freefire-diamond" element={<FreefireDiamond />} />
            <Route path="/product/tiktok-coins" element={<TikTokCoins />} />
            <Route path="/product/unipin-uc" element={<UnipinUC />} />
            <Route path="/product/smile-coin" element={<SmileCoin />} />
            <Route path="/product/chatgpt-plus" element={<ChatGPT />} />
            <Route path="/product/youtube-premium" element={<YouTube />} />
            <Route path="/product/netflix" element={<Netflix />} />
            <Route path="/product/garena-shell" element={<GarenaShell />} />
            <Route
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account" 
              element={
                <ProtectedRoute>
                  <Account />
                </ProtectedRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ChatWidget />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
