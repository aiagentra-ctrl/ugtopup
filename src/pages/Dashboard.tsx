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
import { fetchUserPaymentRequests, fetchUserBalance, type CreditHistoryEntry } from "@/lib/creditApi";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const [creditRequests, setCreditRequests] = useState<CreditHistoryEntry[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract username from profile or email
  const username = profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';
  const orders = 0; // Will integrate with real orders later
  const pendingOrders = 0;

  // Calculate stats from credit data
  const topUps = creditRequests.length;
  const pendingTopUps = creditRequests.filter(r => r.status.toLowerCase() === 'pending').length;

  // Fetch balance from n8n
  useEffect(() => {
    const loadBalance = async () => {
      if (!user?.email || isRefreshing) {
        console.log('[DEBUG] Skipping balance fetch - already refreshing or no email');
        if (!user?.email) setLoadingBalance(false);
        return;
      }

      try {
        const balance = await fetchUserBalance();
        setBalance(balance);
      } catch (error) {
        console.error('Error loading balance:', error);
        toast.error("Failed to load credit balance");
      } finally {
        setLoadingBalance(false);
      }
    };

    loadBalance(); // Load immediately
    const interval = setInterval(loadBalance, 120000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, [user?.email, isRefreshing]);

  // Fetch credit history from n8n
  useEffect(() => {
    const loadHistory = async () => {
      if (!user?.email || isRefreshing) {
        console.log('[DEBUG] Skipping history fetch - already refreshing or no email');
        if (!user?.email) setLoadingHistory(false);
        return;
      }

      setHistoryError(null);
      
      try {
        const requests = await fetchUserPaymentRequests();
        console.log('[DEBUG] History rows received:', requests.length, requests[0] || null);
        setCreditRequests(requests);
      } catch (error: any) {
        console.error('Error loading history:', error);
        
        const errorMsg = error?.message || 'Unknown error';
        if (errorMsg.includes('Invalid data')) {
          setHistoryError('Invalid data received.');
        } else if (errorMsg.includes('timeout')) {
          setHistoryError('Request timeout - please try again later.');
        } else {
          setHistoryError('Failed to load credit history. Please try again later.');
        }
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory(); // Load immediately
    const interval = setInterval(loadHistory, 120000); // Refresh every 2 minutes

    return () => clearInterval(interval);
  }, [user?.email, isRefreshing]);

  const handleTopUpClick = () => {
    setTopUpModalOpen(true);
  };

  const handleTopUpSuccess = async () => {
    toast.success("Credit request submitted! Refreshing data...");
    
    // Sequential refresh: balance first, then history (wait for webhook to respond)
    if (user?.email) {
      setIsRefreshing(true);
      try {
        // Wait for balance to complete first
        console.log('[DEBUG] Refreshing balance first...');
        const balanceData = await fetchUserBalance();
        setBalance(balanceData);
        console.log('[DEBUG] Balance refreshed successfully');
        
        // Only fetch history after balance is done
        console.log('[DEBUG] Now refreshing history...');
        const historyData = await fetchUserPaymentRequests();
        setCreditRequests(historyData);
        console.log('[DEBUG] History refreshed successfully');
      } catch (error) {
        console.error('[DEBUG] Error refreshing credit data:', error);
        toast.error("Failed to refresh data after submission");
      } finally {
        setIsRefreshing(false);
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
            email={email}
            loading={loadingBalance}
            onTopUpClick={handleTopUpClick}
          />
        </div>

        {/* Credit Request History */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <CreditRequestHistory 
            requests={creditRequests} 
            loading={loadingHistory}
            error={historyError}
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
