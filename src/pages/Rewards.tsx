import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Ticket, Trophy, Copy, Check, Clock, CheckCircle2, ShoppingBag, Award } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Coupon {
  id: string;
  code: string;
  discount_percent: number;
  discount_type: string;
  discount_value: number;
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Page Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Gift className="h-7 w-7 text-primary" /> Rewards & Coupons
          </h1>
          <p className="text-sm text-muted-foreground">Earn coupons by completing orders and referring friends</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <Card className="border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <ShoppingBag className="h-5 w-5 text-primary mb-1" />
              <p className="text-2xl font-bold text-primary">{completedOrders}</p>
              <p className="text-[11px] text-muted-foreground">Orders Done</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Ticket className="h-5 w-5 text-primary mb-1" />
              <p className="text-2xl font-bold text-primary">{availableCoupons.length}</p>
              <p className="text-[11px] text-muted-foreground">Coupons Ready</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <Award className="h-5 w-5 text-primary mb-1" />
              <p className="text-2xl font-bold text-primary">{usedCoupons.length}</p>
              <p className="text-[11px] text-muted-foreground">Coupons Used</p>
            </CardContent>
          </Card>
        </div>

        {/* Visual Milestone Stepper */}
        <Card className="border-border animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-primary" /> Milestone Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {milestones.length === 0 && !loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">No milestones configured yet.</p>
            ) : (
              <div className="relative">
                {milestones.map((m, idx) => {
                  const reached = completedOrders >= m.order_count;
                  const isLast = idx === milestones.length - 1;
                  return (
                    <div key={m.id} className="flex items-start gap-4 relative">
                      {/* Vertical connector line */}
                      {!isLast && (
                        <div className="absolute left-[15px] top-[32px] w-[2px] h-[calc(100%-16px)] bg-border" />
                      )}
                      {/* Step circle */}
                      <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        reached
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted border-border text-muted-foreground"
                      }`}>
                        {reached ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </div>
                      {/* Content */}
                      <div className={`flex-1 pb-6 ${reached ? "" : "opacity-60"}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-foreground">
                            {m.order_count} Orders
                          </span>
                          <Badge variant={reached ? "default" : "outline"} className="text-[10px]">
                            {m.discount_percent}% OFF
                          </Badge>
                          {reached && <Badge variant="secondary" className="text-[10px]">Unlocked</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {reached
                            ? "Coupon rewarded! Check your coupons below."
                            : `${m.order_count - completedOrders} more order${m.order_count - completedOrders > 1 ? "s" : ""} to unlock`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coupons Tabs with Ticket-Style Cards */}
        <Tabs defaultValue="available" className="animate-fade-in">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="available">Available ({availableCoupons.length})</TabsTrigger>
            <TabsTrigger value="used">Used ({usedCoupons.length})</TabsTrigger>
            <TabsTrigger value="expired">Expired ({expiredCoupons.length})</TabsTrigger>
          </TabsList>

          {[
            { key: "available", items: availableCoupons, empty: "No available coupons. Keep ordering to earn rewards!" },
            { key: "used", items: usedCoupons, empty: "No used coupons yet." },
            { key: "expired", items: expiredCoupons, empty: "No expired coupons." },
          ].map(tab => (
            <TabsContent key={tab.key} value={tab.key} className="space-y-3 mt-4">
              {tab.items.length === 0 ? (
                <div className="text-center py-10">
                  <Ticket className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">{tab.empty}</p>
                </div>
              ) : tab.items.map(c => (
                <div key={c.id} className="flex items-stretch rounded-xl border border-border overflow-hidden bg-card">
                  {/* Left accent strip */}
                  <div className={`w-2 flex-shrink-0 ${
                    c.is_used ? "bg-muted" : new Date(c.expires_at) <= new Date() ? "bg-destructive/40" : "bg-primary"
                  }`} />
                  {/* Content */}
                  <div className="flex items-center justify-between flex-1 p-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-primary">
                          {c.discount_type === 'fixed' ? `₹${c.discount_value} OFF` : `${c.discount_value || c.discount_percent}% OFF`}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{sourceLabel(c.source)}</Badge>
                      </div>
                      <p className="font-mono text-sm text-foreground tracking-wider">{c.code}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {c.is_used
                          ? `Used on ${format(new Date(c.used_at!), "MMM d, yyyy")}`
                          : new Date(c.expires_at) <= new Date()
                            ? "Expired"
                            : `Expires ${format(new Date(c.expires_at), "MMM d, yyyy")}`}
                      </p>
                    </div>
                    {!c.is_used && new Date(c.expires_at) > new Date() && (
                      <Button size="sm" variant="outline" onClick={() => handleCopy(c.code, c.id)}>
                        {copiedId === c.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
};

export default Rewards;
