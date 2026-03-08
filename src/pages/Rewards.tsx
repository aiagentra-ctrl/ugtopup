import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Ticket, Trophy, Copy, Check, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  source: string;
  is_used: boolean;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

interface Milestone {
  id: string;
  order_count: number;
  discount_percent: number;
  description: string;
}

const Rewards = () => {
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    const fetchData = async () => {
      setLoading(true);
      const [couponsRes, milestonesRes, ordersRes] = await Promise.all([
        supabase.from("coupons").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("reward_milestones").select("*").eq("is_active", true).order("order_count", { ascending: true }),
        supabase.from("product_orders").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
      ]);
      setCoupons((couponsRes.data as Coupon[]) || []);
      setMilestones((milestonesRes.data as Milestone[]) || []);
      setCompletedOrders(ordersRes.count || 0);
      setLoading(false);
    };
    fetchData();
  }, [user?.id]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({ title: "Copied!", description: `Coupon code ${code} copied to clipboard.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const availableCoupons = coupons.filter(c => !c.is_used && new Date(c.expires_at) > new Date());
  const usedCoupons = coupons.filter(c => c.is_used);
  const expiredCoupons = coupons.filter(c => !c.is_used && new Date(c.expires_at) <= new Date());

  const sourceLabel = (s: string) => {
    switch (s) {
      case "milestone": return "Milestone";
      case "referral": return "Referral";
      case "referral_welcome": return "Welcome";
      default: return s;
    }
  };

  const CouponCard = ({ coupon }: { coupon: Coupon }) => (
    <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-bold text-lg text-primary">{coupon.discount_percent}% OFF</span>
          <Badge variant="outline" className="text-xs">{sourceLabel(coupon.source)}</Badge>
          {coupon.is_used && <Badge variant="secondary" className="text-xs">Used</Badge>}
        </div>
        <p className="font-mono text-sm text-foreground tracking-wider">{coupon.code}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {coupon.is_used
            ? `Used on ${format(new Date(coupon.used_at!), "MMM d, yyyy")}`
            : new Date(coupon.expires_at) <= new Date()
              ? "Expired"
              : `Expires ${format(new Date(coupon.expires_at), "MMM d, yyyy")}`}
        </p>
      </div>
      {!coupon.is_used && new Date(coupon.expires_at) > new Date() && (
        <Button size="sm" variant="outline" onClick={() => handleCopy(coupon.code, coupon.id)}>
          {copiedId === coupon.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Gift className="h-8 w-8 text-primary" /> Rewards & Coupons
          </h1>
          <p className="text-muted-foreground">Earn coupons by completing orders and referring friends</p>
        </div>

        {/* Milestone Progress */}
        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" /> Milestone Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You've completed <span className="font-bold text-primary">{completedOrders}</span> orders
            </p>
            <div className="space-y-3">
              {milestones.map((m) => {
                const reached = completedOrders >= m.order_count;
                const progress = Math.min((completedOrders / m.order_count) * 100, 100);
                return (
                  <div key={m.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={reached ? "text-primary font-medium" : "text-muted-foreground"}>
                        {reached ? <CheckCircle2 className="inline h-4 w-4 mr-1" /> : <Clock className="inline h-4 w-4 mr-1" />}
                        {m.order_count} orders → {m.discount_percent}% OFF
                      </span>
                      <span className="text-xs text-muted-foreground">{completedOrders}/{m.order_count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${reached ? "bg-primary" : "bg-primary/40"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {milestones.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground">No milestones configured yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Coupons Tabs */}
        <Tabs defaultValue="available" className="animate-fade-in">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="available">Available ({availableCoupons.length})</TabsTrigger>
            <TabsTrigger value="used">Used ({usedCoupons.length})</TabsTrigger>
            <TabsTrigger value="expired">Expired ({expiredCoupons.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="available" className="space-y-3 mt-4">
            {availableCoupons.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No available coupons. Keep ordering to earn rewards!</p>
            ) : availableCoupons.map(c => <CouponCard key={c.id} coupon={c} />)}
          </TabsContent>
          <TabsContent value="used" className="space-y-3 mt-4">
            {usedCoupons.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No used coupons yet.</p>
            ) : usedCoupons.map(c => <CouponCard key={c.id} coupon={c} />)}
          </TabsContent>
          <TabsContent value="expired" className="space-y-3 mt-4">
            {expiredCoupons.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No expired coupons.</p>
            ) : expiredCoupons.map(c => <CouponCard key={c.id} coupon={c} />)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Rewards;
