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
import { NotificationPermissionModal } from "./components/NotificationPermissionModal";
import { OfflineIndicator } from "./components/OfflineIndicator";
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
import CouponPolicy from "./pages/CouponPolicy";
import UserNotifications from "./pages/UserNotifications";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import LoginRequired from "./pages/LoginRequired";
import Rewards from "./pages/Rewards";
import Referrals from "./pages/Referrals";
import ReferAndEarn from "./pages/ReferAndEarn";

import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import DeveloperPanel from "./pages/DeveloperPanel";
import { DeveloperRoute } from "./components/DeveloperRoute";
import SupportTickets from "./pages/SupportTickets";
import Wishlist from "./pages/Wishlist";
import Subscriptions from "./pages/Subscriptions";
import { AnnouncementBanner } from "./components/announcements/AnnouncementBanner";
import { PageTrackingProvider } from "./components/PageTrackingProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount) => {
        if (!navigator.onLine) return false;
        return failureCount < 2;
      },
      networkMode: "offlineFirst",
    },
    mutations: {
      networkMode: "offlineFirst",
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<LoadingScreen />}>
            <PageTrackingProvider>
            <AnnouncementBanner />
            <Routes>
              <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
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
            <Route path="/coupon-policy" element={<CouponPolicy />} />
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
            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <UserNotifications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/rewards" 
              element={
                <ProtectedRoute>
                  <Rewards />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/referrals" 
              element={
                <ProtectedRoute>
                  <Referrals />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/refer-earn" 
              element={
                <ProtectedRoute>
                  <ReferAndEarn />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/support" 
              element={
                <ProtectedRoute>
                  <SupportTickets />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/wishlist" 
              element={
                <ProtectedRoute>
                  <Wishlist />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subscriptions" 
              element={
                <ProtectedRoute>
                  <Subscriptions />
                </ProtectedRoute>
              } 
            />
            {/* Payment result pages */}
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
            <Route path="/login-required" element={<LoginRequired />} />
            
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              } 
            />
            <Route 
              path="/developer" 
              element={
                <DeveloperRoute>
                  <DeveloperPanel />
                </DeveloperRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          <ChatWidget />
          <NotificationPermissionModal />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
