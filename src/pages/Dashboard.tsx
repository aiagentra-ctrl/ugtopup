import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { UserProfileCard } from "@/components/dashboard/UserProfileCard";
import { StatisticsCard } from "@/components/dashboard/StatisticsCard";
import { CreditBalanceCard } from "@/components/dashboard/CreditBalanceCard";
import { OrderHistoryCard } from "@/components/dashboard/OrderHistoryCard";
import { TrustBadges } from "@/components/dashboard/TrustBadges";
import { CreditRequestHistory } from "@/components/topup/CreditRequestHistory";
import { TopUpModal } from "@/components/topup/TopUpModal";
import { toast } from "sonner";
import { fetchUserPaymentRequests, type CreditHistoryEntry } from "@/lib/creditApi";
import { fetchUserOrders, type Order } from "@/lib/orderApi";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [balance, setBalance] = useState(profile?.balance || 0);
  const [creditRequests, setCreditRequests] = useState<CreditHistoryEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Extract username from profile or email
  const username = profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || '';

  // Calculate stats from credit data
  const topUps = creditRequests.length;
  const pendingTopUps = creditRequests.filter(r => r.status.toLowerCase() === 'pending').length;
  
  // Calculate stats from orders
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // Real-time balance updates
  useEffect(() => {
    if (!user?.id) return;

    // Set initial balance from profile
    if (profile?.balance !== undefined) {
      setBalance(profile.balance);
      setLoadingBalance(false);
    }

    // Subscribe to real-time balance changes
    const channel = supabase
      .channel('balance-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Real-time] Balance updated:', payload.new.balance);
          setBalance(payload.new.balance);
          toast.success('Balance updated!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, profile?.balance]);

  // Real-time credit request updates
  useEffect(() => {
    if (!user?.id) return;

    const loadHistory = async () => {
      setHistoryError(null);
      try {
        const requests = await fetchUserPaymentRequests();
        setCreditRequests(requests);
      } catch (error: any) {
        console.error('Error loading history:', error);
        setHistoryError('Failed to load credit history.');
      } finally {
        setLoadingHistory(false);
      }
    };

    loadHistory();

    // Subscribe to real-time payment request changes
    const channel = supabase
      .channel('payment-request-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_requests',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Real-time] Payment request updated:', payload);
          loadHistory(); // Reload history when any change occurs
          toast.success('Credit request updated!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Real-time order updates
  useEffect(() => {
    if (!user?.id) return;

    const loadOrders = async () => {
      setOrdersError(null);
      try {
        const userOrders = await fetchUserOrders();
        setOrders(userOrders);
      } catch (error: any) {
        console.error('Error loading orders:', error);
        setOrdersError('Failed to load order history.');
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();

    // Subscribe to real-time order changes
    const channel = supabase
      .channel('order-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'product_orders',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('[Real-time] Order updated:', payload);
          loadOrders(); // Reload orders when any change occurs
          toast.success('Order status updated!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleTopUpClick = () => {
    setTopUpModalOpen(true);
  };

  const handleTopUpSuccess = async () => {
    toast.success("Credit request submitted successfully!");
    setTopUpModalOpen(false);
    // Real-time subscriptions will handle the updates automatically
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
            orders={totalOrders}
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
          <OrderHistoryCard 
            orders={orders}
            loading={loadingOrders}
            error={ordersError}
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
