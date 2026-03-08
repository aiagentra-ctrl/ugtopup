import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EnhancedDashboard } from "@/components/admin/EnhancedDashboard";
import { CreditRequestsTable } from "@/components/admin/CreditRequestsTable";
import { OrderManagement } from "@/components/admin/OrderManagement";
import { ActivityLogs } from "@/components/admin/ActivityLogs";
import { ProductsList } from "@/components/admin/ProductsList";
import { AddProduct } from "@/components/admin/AddProduct";
import { EditProduct } from "@/components/admin/EditProduct";
import { UserData } from "@/components/admin/UserData";
import { SupabaseLimits } from "@/components/admin/SupabaseLimits";
import { GameProductPrices } from "@/components/admin/GameProductPrices";
import NotificationsManager from "@/components/admin/NotificationsManager";
import { BannerManager } from "@/components/admin/BannerManager";
import { OnlinePayments } from "@/components/admin/OnlinePayments";
import { LianaOrdersDashboard } from "@/components/admin/LianaOrdersDashboard";
import { DynamicProductManager } from "@/components/admin/DynamicProductManager";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { OfferManager } from "@/components/admin/OfferManager";
import { ChatbotSettings } from "@/components/admin/ChatbotSettings";
import { VoucherInventory } from "@/components/admin/VoucherInventory";
import { MLApiMonitoring } from "@/components/admin/MLApiMonitoring";
import { AdminAppDownload } from "@/components/admin/AdminAppDownload";
import { RewardMilestoneManager } from "@/components/admin/RewardMilestoneManager";
import { ReferralManager } from "@/components/admin/ReferralManager";
import { checkAdminAccess } from "@/lib/adminApi";
import { useAdminPushNotifications } from "@/hooks/useAdminPushNotifications";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const { isSupported, isSubscribed, permission, requestAndSubscribe } = useAdminPushNotifications();

  // Deep-link: read ?section= param on load
  useEffect(() => {
    const section = searchParams.get("section");
    if (section) {
      setActiveSection(section);
      // Clear the param after reading
      setSearchParams({}, { replace: true });
    }
  }, []);

  useEffect(() => {
    const verifyAccess = async () => {
      try {
        const hasAccess = await checkAdminAccess();
        if (!hasAccess) {
          toast.error("Access denied. You don't have admin privileges.");
          navigate("/");
          return;
        }
      } catch (error) {
        console.error("Error checking admin access:", error);
        toast.error("Failed to verify admin access");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    verifyAccess();
  }, [navigate]);

  // Show push notification prompt for admins
  const showPushPrompt = isSupported && permission === 'default' && !loading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return <EnhancedDashboard />;
      case "online-payments":
        return <OnlinePayments />;
      case "payments":
        return <CreditRequestsTable />;
      case "orders":
        return <OrderManagement />;
      case "liana-orders":
        return <LianaOrdersDashboard />;
      case "products":
        return <ProductsList />;
      case "game-pricing":
        return <GameProductPrices />;
      case "banners":
        return <BannerManager />;
      case "notifications":
        return <NotificationsManager />;
      case "add-product":
        return <AddProduct />;
      case "edit-product":
        return <EditProduct />;
      case "users":
        return <UserData />;
      case "activity":
        return <ActivityLogs />;
      case "supabase-limits":
        return <SupabaseLimits />;
      case "product-update":
        return <DynamicProductManager />;
      case "categories":
        return <CategoryManager />;
      case "offers":
        return <OfferManager />;
      case "chatbot":
        return <ChatbotSettings />;
      case "vouchers":
        return <VoucherInventory />;
      case "ml-monitoring":
        return <MLApiMonitoring />;
      case "admin-app":
        return <AdminAppDownload />;
      default:
        return <EnhancedDashboard />;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {/* Push notification prompt banner */}
      {showPushPrompt && (
        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3 flex-wrap">
          <Bell className="h-5 w-5 text-primary shrink-0" />
          <p className="text-sm text-foreground flex-1">Enable push notifications to get instant alerts for new orders and credit requests.</p>
          <Button size="sm" onClick={requestAndSubscribe} className="shrink-0">
            Enable Notifications
          </Button>
        </div>
      )}
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPanel;
