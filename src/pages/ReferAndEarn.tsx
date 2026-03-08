import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useOffers, Offer } from "@/hooks/useOffers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Copy, Check, Gift, UserPlus, Clock, CheckCircle2,
  Trophy, Ticket, ExternalLink, Share2, MessageCircle, Send,
  ChevronDown, ChevronUp,
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

  const shareMessage = `🎮 Join UGTOPUPS and get special offers on game top-ups! Use my referral link: ${referralLink}`;

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

      // Fetch referee profiles
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
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
  const shareTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`, "_blank");

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">

        {/* Hero */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 border border-primary/20 p-6 md:p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Refer & Earn</h1>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            Invite friends, earn coupons, and enjoy exclusive offers on every top-up!
          </p>
        </div>

        {/* Referral Link + Share */}
        <Card className="border-border bg-card animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" /> Share Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-xs sm:text-sm bg-muted" />
              <Button onClick={handleCopyLink} variant="outline" className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Code: <span className="font-mono font-bold text-primary">{profile?.referral_code || "..."}</span>
              {settings && (
                <span className="ml-2">
                  · You get <span className="text-primary font-semibold">{settings.referrer_discount_percent}% OFF</span>, friend gets <span className="text-primary font-semibold">{settings.referee_discount_percent}% OFF</span>
                </span>
              )}
            </p>

            {/* Social Share Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-[#25D366] hover:bg-[#25D366]/90 text-white" onClick={shareWhatsApp}>
                <MessageCircle className="h-4 w-4 mr-1.5" /> WhatsApp
              </Button>
              <Button size="sm" className="bg-[#0088cc] hover:bg-[#0088cc]/90 text-white" onClick={shareTelegram}>
                <Send className="h-4 w-4 mr-1.5" /> Telegram
              </Button>
              <Button size="sm" className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white" onClick={shareFacebook}>
                Facebook
              </Button>
              <Button size="sm" className="bg-foreground hover:bg-foreground/90 text-background" onClick={shareTwitter}>
                X / Twitter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-2xl font-bold text-primary">{totalReferred}</p>
              <p className="text-xs text-muted-foreground">Total Referred</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
              <p className="text-2xl font-bold text-green-500">{successfulReferrals}</p>
              <p className="text-xs text-muted-foreground">Successful</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-2xl font-bold text-yellow-500">{pendingReferrals}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Milestone Progress */}
        <Card className="border-border bg-card animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Reward Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              You've completed <span className="font-bold text-primary">{completedOrders}</span> orders
            </p>
            <div className="space-y-4">
              {milestones.map(m => {
                const reached = completedOrders >= m.order_count;
                const progress = Math.min((completedOrders / m.order_count) * 100, 100);
                return (
                  <div key={m.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className={reached ? "text-primary font-medium" : "text-muted-foreground"}>
                        {reached ? <CheckCircle2 className="inline h-4 w-4 mr-1" /> : <Clock className="inline h-4 w-4 mr-1" />}
                        {m.order_count} orders → {m.discount_percent}% OFF coupon
                      </span>
                      <span className="text-xs text-muted-foreground">{Math.min(completedOrders, m.order_count)}/{m.order_count}</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })}
              {milestones.length === 0 && !loading && (
                <p className="text-sm text-muted-foreground text-center py-4">No milestones configured yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Available Offers */}
        <Card className="border-border bg-card animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" /> Available Offers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Active offers from DB */}
            {offers.length > 0 && offers.map(offer => (
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
                  {offer.timer_end_date && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Expires {format(new Date(offer.timer_end_date), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                {offer.product_link && (
                  <Button size="sm" variant="outline" asChild>
                    <Link to={offer.product_link}><ExternalLink className="h-3.5 w-3.5" /></Link>
                  </Button>
                )}
              </div>
            ))}

            {/* Global promo codes */}
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
                  {gc.expires_at && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Expires {format(new Date(gc.expires_at), "MMM d, yyyy")}
                    </p>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => handleCopyCode(gc.coupon_code!, gc.id)}>
                  {copiedId === gc.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            ))}

            {offers.length === 0 && globalCodes.length === 0 && !offersLoading && (
              <p className="text-sm text-muted-foreground text-center py-4">No active offers right now. Check back soon!</p>
            )}
          </CardContent>
        </Card>

        {/* My Coupons */}
        <Card className="border-border bg-card animate-fade-in">
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
                    <p className="text-center text-muted-foreground py-6 text-sm">{tab.empty}</p>
                  ) : tab.items.map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-primary text-sm">
                            {discountDisplay(c.discount_type, c.discount_value, c.discount_percent)}
                          </span>
                          <Badge variant="outline" className="text-[10px]">{sourceLabel(c.source)}</Badge>
                          {c.is_used && <Badge variant="secondary" className="text-[10px]">Used</Badge>}
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
                  ))}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Referral History — Collapsible */}
        <Card className="border-border bg-card animate-fade-in">
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
                <p className="text-center text-muted-foreground py-6 text-sm">No referrals yet. Share your link to get started!</p>
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
                      <Badge variant={r.status === "completed" ? "default" : "secondary"}>
                        {r.status === "completed" ? (
                          <><CheckCircle2 className="h-3 w-3 mr-1" /> Rewarded</>
                        ) : (
                          <><Clock className="h-3 w-3 mr-1" /> Pending</>
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
