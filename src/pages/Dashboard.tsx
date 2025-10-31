import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { UserProfileCard } from "@/components/dashboard/UserProfileCard";
import { StatisticsCard } from "@/components/dashboard/StatisticsCard";
import { CreditBalanceCard } from "@/components/dashboard/CreditBalanceCard";
import { EmptyStateCard } from "@/components/dashboard/EmptyStateCard";
import { TrustBadges } from "@/components/dashboard/TrustBadges";
import { CreditRequestHistory } from "@/components/topup/CreditRequestHistory";
import { TopUpModal } from "@/components/topup/TopUpModal";
import { CreditCard, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useCreditPoller } from "@/hooks/useCreditPoller";
import { getUserBalance } from "@/lib/balanceStorage";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [balance, setBalance] = useState(0);

  // Enable polling when user is logged in
  const { isPolling } = useCreditPoller(!!user);

  // Extract username from profile or email
  const username = profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const orders = 0; // Will integrate with real orders later
  const topUps = 0; // Will integrate with real top-ups later
  const pendingOrders = 0;
  const pendingTopUps = 0;

  // Load balance from localStorage
  useEffect(() => {
    setBalance(getUserBalance());
  }, [refreshKey]);

  // Listen for credit updates
  useEffect(() => {
    const handleCreditUpdate = () => {
      setBalance(getUserBalance());
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('creditStatusUpdated', handleCreditUpdate);
    
    return () => {
      window.removeEventListener('creditStatusUpdated', handleCreditUpdate);
    };
  }, []);

  const handleTopUpClick = () => {
    setTopUpModalOpen(true);
  };

  const handleTopUpSuccess = () => {
    setRefreshKey(prev => prev + 1);
    toast.success("Credit request submitted! Waiting for approval...");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Welcome {username}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            This is your dashboard. View your account, top-ups, and orders.
          </p>
        </div>

        {/* Profile and Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <UserProfileCard 
            username={username}
            email={email}
          />
          
          <StatisticsCard 
            topUps={topUps}
            orders={orders}
            pendingTopUps={pendingTopUps}
            pendingOrders={pendingOrders}
          />
        </div>

        {/* Credit Balance Card */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CreditBalanceCard 
            balance={balance}
            onTopUpClick={handleTopUpClick}
          />
        </div>

        {/* Credit Request History */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CreditRequestHistory key={refreshKey} />
        </div>

        {/* Order History */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <EmptyStateCard 
            title="Order History"
            total={orders}
            icon={<ShoppingBag className="h-10 w-10 text-green-500" />}
            emptyTitle="No orders yet"
            emptySubtitle="Your order history will appear here"
          />
        </div>

        {/* Trust Badges */}
        <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
          <TrustBadges />
        </div>
      </main>

      {/* Top-Up Modal */}
      <TopUpModal 
        open={topUpModalOpen}
        onOpenChange={setTopUpModalOpen}
        onSuccess={handleTopUpSuccess}
      />
    </div>
  );
};

export default Dashboard;
