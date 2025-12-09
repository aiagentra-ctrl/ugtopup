import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter as BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { ChatWidget } from "./components/chat/ChatWidget";
import { LoadingScreen } from "./components/LoadingScreen";
import Index from "./pages/Index";
import AdminPanel from "./pages/AdminPanel";
import AdminLogin from "./pages/AdminLogin";
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
import MobileLegends from "./pages/MobileLegends";
import RobloxTopUp from "./pages/RobloxTopUp";
import PubgMobile from "./pages/PubgMobile";
import LogoDesign from "./pages/LogoDesign";
import PostDesign from "./pages/PostDesign";
import BannerDesign from "./pages/BannerDesign";
import ThumbnailDesign from "./pages/ThumbnailDesign";
import ContactUs from "./pages/ContactUs";
import RefundPolicy from "./pages/RefundPolicy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
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
            <Route path="/product/mobile-legends" element={<MobileLegends />} />
            <Route path="/product/roblox-topup" element={<RobloxTopUp />} />
            <Route path="/product/pubg-mobile" element={<PubgMobile />} />
            <Route path="/product/logo-design" element={<LogoDesign />} />
            <Route path="/product/post-design" element={<PostDesign />} />
            <Route path="/product/banner-design" element={<BannerDesign />} />
            <Route path="/product/thumbnail-design" element={<ThumbnailDesign />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
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
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <ChatWidget />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
