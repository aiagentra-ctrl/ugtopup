import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useOffers, Offer } from "@/hooks/useOffers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Copy, Check, Gift, UserPlus, Clock, CheckCircle2,
  Trophy, Ticket, ExternalLink, Share2, MessageCircle, Send,
  ChevronDown, ChevronUp, ArrowRight, ShoppingBag,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Link } from "react-router-dom";

interface Referral {
  id: string;
  referee_id: string;
  status: string;
  rewarded: boolean;
  created_at: string;
  referee_profile?: { username: string | null; email: string };
}

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

interface ReferralSettings {
  is_enabled: boolean;
  referrer_discount_percent: number;
  referee_discount_percent: number;
  min_order_amount: number;
}

interface GlobalCode {
  id: string;
  name: string;
  coupon_code: string;
  discount_type: string;
  discount_value: number;
  expires_at: string | null;
}

const ReferAndEarn = () => {
  const { user, profile } = useAuth();
  const { offers, loading: offersLoading } = useOffers("all");

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [completedOrders, setCompletedOrders] = useState(0);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [globalCodes, setGlobalCodes] = useState<GlobalCode[]>([]);

  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/#/signup?ref=${profile.referral_code}`
    : "";

  const shareMessage = `Join UGTOPUPS and get special offers on game top-ups! Use my referral link: ${referralLink}`;

  useEffect(() => {
    if (!user?.id) return;
    const fetchAll = async () => {
      setLoading(true);
      const [refRes, coupRes, mileRes, ordRes, settRes, globalRes] = await Promise.all([
        supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("coupons").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("reward_milestones").select("*").eq("is_active", true).order("order_count", { ascending: true }),
        supabase.from("product_orders").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "completed"),
        supabase.from("referral_settings").select("*").limit(1).single(),
        supabase.from("coupon_rules").select("id,name,coupon_code,discount_type,discount_value,expires_at").eq("is_active", true).eq("rule_type", "global_code"),
      ]);

      const refs = (refRes.data || []) as any[];
      if (refs.length > 0) {
        const ids = refs.map((r: any) => r.referee_id);
        const { data: profiles } = await supabase.from("profiles").select("id, username, email").in("id", ids);
        const map = new Map(profiles?.map(p => [p.id, p]) || []);
        setReferrals(refs.map(r => ({ ...r, referee_profile: map.get(r.referee_id) as any })));
      } else {
        setReferrals([]);
      }

      setCoupons((coupRes.data as Coupon[]) || []);
      setMilestones((mileRes.data as Milestone[]) || []);
      setCompletedOrders(ordRes.count || 0);
      if (settRes.data) setSettings(settRes.data as any);
      setGlobalCodes((globalRes.data as GlobalCode[]) || []);
      setLoading(false);
    };
    fetchAll();
  }, [user?.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with your friends to earn rewards." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast({ title: "Copied!", description: `Code ${code} copied to clipboard.` });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, "_blank");
  const shareTelegram = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`, "_blank");

  const totalReferred = referrals.length;
  const successfulReferrals = referrals.filter(r => r.status === "completed").length;
  const pendingReferrals = referrals.filter(r => r.status === "pending").length;

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

  const discountDisplay = (type: string, value: number, percent?: number) =>
    type === "fixed" ? `₹${value} OFF` : `${value || percent}% OFF`;

  const steps = [
    { icon: Share2, title: "Share Link", desc: "Send your referral link to friends" },
    { icon: UserPlus, title: "Friend Joins", desc: "They sign up and place an order" },
    { icon: Gift, title: "Both Earn", desc: "You both get discount coupons!" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">

        {/* Page Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Gift className="h-7 w-7 text-primary" /> Refer & Earn
          </h1>
          <p className="text-sm text-muted-foreground">
            Invite friends, earn coupons, and enjoy exclusive offers on every top-up!
          </p>
        </div>

        {/* How It Works - 3 Steps */}
        <Card className="border-border animate-fade-in">
          <CardContent className="p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">How it works</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">{step.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-tight">{step.desc}</p>
                    </div>
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className="hidden sm:block h-4 w-4 text-muted-foreground flex-shrink-0 mx-2" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Share Section */}
        <Card className="border-primary/30 bg-primary/5 animate-fade-in">
          <CardContent className="p-5 space-y-3">
            <p className="font-semibold text-foreground text-sm">Your Referral Link</p>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-xs bg-background" />
              <Button onClick={handleCopyLink} className="shrink-0 gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Code: <span className="font-mono font-bold text-primary">{profile?.referral_code || "..."}</span>
                {settings && (
                  <span className="ml-2">
                    · You get <span className="text-primary font-semibold">{settings.referrer_discount_percent}%</span>, friend gets <span className="text-primary font-semibold">{settings.referee_discount_percent}%</span>
                  </span>
                )}
              </p>
              <div className="flex gap-1.5">
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={shareWhatsApp}>
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={shareTelegram}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="flex items-center gap-3 flex-wrap animate-fade-in">
          <Badge variant="outline" className="py-2 px-4 text-sm gap-1.5">
            <Users className="h-3.5 w-3.5" /> {totalReferred} Referred
          </Badge>
          <Badge variant="outline" className="py-2 px-4 text-sm gap-1.5 text-green-600 border-green-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> {successfulReferrals} Successful
          </Badge>
          <Badge variant="outline" className="py-2 px-4 text-sm gap-1.5 text-yellow-600 border-yellow-200">
            <Clock className="h-3.5 w-3.5" /> {pendingReferrals} Pending
          </Badge>
          <Badge variant="outline" className="py-2 px-4 text-sm gap-1.5">
            <ShoppingBag className="h-3.5 w-3.5" /> {completedOrders} Orders
          </Badge>
        </div>

        {/* Milestone Stepper */}
        {milestones.length > 0 && (
          <Card className="border-border animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" /> Reward Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {milestones.map((m, idx) => {
                  const reached = completedOrders >= m.order_count;
                  const isLast = idx === milestones.length - 1;
                  return (
                    <div key={m.id} className="flex items-start gap-4 relative">
                      {!isLast && (
                        <div className="absolute left-[15px] top-[32px] w-[2px] h-[calc(100%-16px)] bg-border" />
                      )}
                      <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        reached
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-muted border-border text-muted-foreground"
                      }`}>
                        {reached ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </div>
                      <div className={`flex-1 pb-6 ${reached ? "" : "opacity-60"}`}>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-foreground">{m.order_count} Orders</span>
                          <Badge variant={reached ? "default" : "outline"} className="text-[10px]">{m.discount_percent}% OFF</Badge>
                          {reached && <Badge variant="secondary" className="text-[10px]">Unlocked</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {reached ? "Coupon rewarded!" : `${m.order_count - completedOrders} more to unlock`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Offers */}
        {(offers.length > 0 || globalCodes.length > 0) && (
          <Card className="border-border animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" /> Available Offers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {offers.map(offer => (
                <div key={offer.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-foreground text-sm">{offer.title}</span>
                      {offer.badge_text && (
                        <Badge className="text-xs" style={{ backgroundColor: offer.badge_color || undefined, color: offer.badge_text_color || undefined }}>
                          {offer.badge_text}
                        </Badge>
                      )}
                    </div>
                    {offer.subtitle && <p className="text-xs text-muted-foreground">{offer.subtitle}</p>}
                  </div>
                  {offer.product_link && (
                    <Button size="sm" variant="outline" asChild>
                      <Link to={offer.product_link}><ExternalLink className="h-3.5 w-3.5" /></Link>
                    </Button>
                  )}
                </div>
              ))}

              {globalCodes.map(gc => (
                <div key={gc.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/20 bg-primary/5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-foreground text-sm">{gc.name}</span>
                      <Badge variant="outline" className="text-xs text-primary border-primary/30">
                        {discountDisplay(gc.discount_type, gc.discount_value)}
                      </Badge>
                    </div>
                    <p className="font-mono text-xs text-primary tracking-wider">{gc.coupon_code}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleCopyCode(gc.coupon_code!, gc.id)}>
                    {copiedId === gc.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* My Coupons - Ticket Style */}
        <Card className="border-border animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> My Coupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="available">
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
                      <div className={`w-2 flex-shrink-0 ${
                        c.is_used ? "bg-muted" : new Date(c.expires_at) <= new Date() ? "bg-destructive/40" : "bg-primary"
                      }`} />
                      <div className="flex items-center justify-between flex-1 p-3 gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-primary text-sm">
                              {discountDisplay(c.discount_type, c.discount_value, c.discount_percent)}
                            </span>
                            <Badge variant="outline" className="text-[10px]">{sourceLabel(c.source)}</Badge>
                          </div>
                          <p className="font-mono text-xs text-foreground tracking-wider">{c.code}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {c.is_used
                              ? `Used on ${format(new Date(c.used_at!), "MMM d, yyyy")}`
                              : new Date(c.expires_at) <= new Date()
                                ? "Expired"
                                : `Expires ${format(new Date(c.expires_at), "MMM d, yyyy")}`}
                          </p>
                        </div>
                        {!c.is_used && new Date(c.expires_at) > new Date() && (
                          <Button size="sm" variant="outline" onClick={() => handleCopyCode(c.code, c.id)}>
                            {copiedId === c.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Referral History — Collapsible */}
        <Card className="border-border animate-fade-in">
          <CardHeader className="pb-3 cursor-pointer" onClick={() => setHistoryOpen(!historyOpen)}>
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Referral History
              </span>
              {historyOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </CardTitle>
          </CardHeader>
          {historyOpen && (
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-6 text-sm">Loading...</p>
              ) : referrals.length === 0 ? (
                <div className="text-center py-8">
                  <UserPlus className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No referrals yet. Share your link to get started!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {referrals.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background/50">
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {r.referee_profile?.username || r.referee_profile?.email || "User"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Joined {format(new Date(r.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant={r.status === "completed" ? "default" : "secondary"} className="gap-1">
                        {r.status === "completed" ? (
                          <><CheckCircle2 className="h-3 w-3" /> Rewarded</>
                        ) : (
                          <><Clock className="h-3 w-3" /> Pending</>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

      </main>
    </div>
  );
};

export default ReferAndEarn;
