import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { EnhancedDashboard } from "@/components/admin/EnhancedDashboard";
import { CreditRequestsTable } from "@/components/admin/CreditRequestsTable";
import { OrderManagement } from "@/components/admin/OrderManagement";
import { ActivityLogs } from "@/components/admin/ActivityLogs";
import { checkAdminAccess } from "@/lib/adminApi";
import { toast } from "sonner";

const AdminPanel = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [loading, setLoading] = useState(true);

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
      case "payments":
        return <CreditRequestsTable />;
      case "orders":
        return <OrderManagement />;
      case "activity":
        return <ActivityLogs />;
      default:
        return <EnhancedDashboard />;
    }
  };

  return (
    <AdminLayout activeSection={activeSection} onSectionChange={setActiveSection}>
      {renderContent()}
    </AdminLayout>
  );
};

export default AdminPanel;
