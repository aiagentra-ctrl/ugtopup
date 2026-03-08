import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Copy, Check, Gift, UserPlus, Clock, CheckCircle2, Share2, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Referral {
  id: string;
  referee_id: string;
  status: string;
  rewarded: boolean;
  rewarded_at: string | null;
  created_at: string;
  referee_profile?: { username: string | null; email: string };
}

const Referrals = () => {
  const { user, profile } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const referralLink = profile?.referral_code
    ? `${window.location.origin}/#/signup?ref=${profile.referral_code}`
    : "";

  useEffect(() => {
    if (!user?.id) return;
    const fetchReferrals = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      
      if (data && data.length > 0) {
        const refereeIds = data.map(r => r.referee_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, email")
          .in("id", refereeIds);
        
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
        setReferrals(data.map(r => ({
          ...r,
          referee_profile: profileMap.get(r.referee_id) as any
        })));
      } else {
        setReferrals([]);
      }
      setLoading(false);
    };
    fetchReferrals();
  }, [user?.id]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Link copied!", description: "Share it with your friends to earn rewards." });
    setTimeout(() => setCopied(false), 2000);
  };

  const totalReferred = referrals.length;
  const successfulReferrals = referrals.filter(r => r.status === "completed").length;
  const pendingReferrals = referrals.filter(r => r.status === "pending").length;

  const steps = [
    { icon: Share2, title: "Share Link", desc: "Copy and send your referral link to friends" },
    { icon: UserPlus, title: "Friend Signs Up", desc: "They create an account using your link" },
    { icon: Gift, title: "Both Earn", desc: "You both get discount coupons on first order" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Page Header */}
        <div className="animate-fade-in">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Users className="h-7 w-7 text-primary" /> Referrals
          </h1>
          <p className="text-sm text-muted-foreground">Invite friends and earn coupons when they make their first purchase</p>
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

        {/* Referral Link - Prominent CTA */}
        <Card className="border-primary/30 bg-primary/5 animate-fade-in">
          <CardContent className="p-5 space-y-3">
            <p className="font-semibold text-foreground text-sm">Your Referral Link</p>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-xs bg-background" />
              <Button onClick={handleCopy} className="shrink-0 gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Your code: <span className="font-mono font-bold text-primary">{profile?.referral_code || "..."}</span>
            </p>
          </CardContent>
        </Card>

        {/* Stats as Inline Row */}
        <div className="flex items-center gap-3 animate-fade-in">
          <Badge variant="outline" className="py-2 px-4 text-sm gap-1.5">
            <Users className="h-3.5 w-3.5" /> {totalReferred} Referred
          </Badge>
          <Badge variant="outline" className="py-2 px-4 text-sm gap-1.5 text-green-600 border-green-200">
            <CheckCircle2 className="h-3.5 w-3.5" /> {successfulReferrals} Successful
          </Badge>
          <Badge variant="outline" className="py-2 px-4 text-sm gap-1.5 text-yellow-600 border-yellow-200">
            <Clock className="h-3.5 w-3.5" /> {pendingReferrals} Pending
          </Badge>
        </div>

        {/* Referral History */}
        <Card className="border-border animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Referral History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8 text-sm">Loading...</p>
            ) : referrals.length === 0 ? (
              <div className="text-center py-10">
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
                      <p className="text-xs text-muted-foreground">
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
        </Card>
      </main>
    </div>
  );
};

export default Referrals;
