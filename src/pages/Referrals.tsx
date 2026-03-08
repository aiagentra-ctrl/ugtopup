import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Copy, Check, Gift, UserPlus, Clock, CheckCircle2 } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" /> Referrals
          </h1>
          <p className="text-muted-foreground">Invite friends and earn coupon rewards when they make their first purchase</p>
        </div>

        {/* Referral Link Card */}
        <Card className="mb-6 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Your Referral Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input value={referralLink} readOnly className="font-mono text-sm bg-muted" />
              <Button onClick={handleCopy} variant="outline" className="shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your referral code: <span className="font-mono font-bold text-primary">{profile?.referral_code || "..."}</span>
            </p>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalReferred}</p>
              <p className="text-xs text-muted-foreground">Total Referred</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{successfulReferrals}</p>
              <p className="text-xs text-muted-foreground">Successful</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{pendingReferrals}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral History */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" /> Referral History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : referrals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No referrals yet. Share your link to get started!</p>
            ) : (
              <div className="space-y-3">
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
        </Card>
      </main>
    </div>
  );
};

export default Referrals;
