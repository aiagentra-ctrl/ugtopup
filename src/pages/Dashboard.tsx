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
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { fetchUserCredits, type UserCreditData } from "@/lib/creditApi";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [creditData, setCreditData] = useState<UserCreditData | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract username from profile or email
  const username = profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const orders = 0; // Will integrate with real orders later
  const pendingOrders = 0;

  // Calculate stats from credit data
  const balance = creditData?.balance || 0;
  const topUps = creditData?.requests.length || 0;
  const pendingTopUps = creditData?.requests.filter(r => r.status === 'pending').length || 0;

  // Fetch data from n8n
  useEffect(() => {
    const loadData = async () => {
      if (!user?.email) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchUserCredits(user.email);
        setCreditData(data);
      } catch (error) {
        console.error('Error loading credit data:', error);
        toast.error("Failed to load credit data");
      } finally {
        setLoading(false);
      }
    };

    loadData(); // Load immediately
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [user?.email]);

  const handleTopUpClick = () => {
    setTopUpModalOpen(true);
  };

  const handleTopUpSuccess = async () => {
    toast.success("Credit request submitted! Refreshing data...");
    
    // Immediately refresh data from n8n
    if (user?.email) {
      try {
        const data = await fetchUserCredits(user.email);
        setCreditData(data);
      } catch (error) {
        console.error('Error refreshing credit data:', error);
      }
    }
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
          <CreditRequestHistory 
            requests={creditData?.requests || []} 
            loading={loading}
          />
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
