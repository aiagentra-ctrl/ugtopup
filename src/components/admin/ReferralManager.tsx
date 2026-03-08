import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Save, Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReferralSettings {
  id: string;
  is_enabled: boolean;
  referrer_discount_percent: number;
  referee_discount_percent: number;
  referrer_coupon_validity_days: number;
  referee_coupon_validity_days: number;
  min_order_amount: number;
  reward_after: string;
}

interface ReferralRow {
  id: string;
  referrer_id: string;
  referee_id: string;
  status: string;
  rewarded: boolean;
  created_at: string;
}

export function ReferralManager() {
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const [settingsRes, referralsRes] = await Promise.all([
        supabase.from("referral_settings").select("*").limit(1).single(),
        supabase.from("referrals").select("*").order("created_at", { ascending: false }).limit(100),
      ]);
      if (settingsRes.data) setSettings(settingsRes.data as ReferralSettings);
      setReferrals((referralsRes.data as ReferralRow[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    const { error } = await supabase.from("referral_settings").update({
      is_enabled: settings.is_enabled,
      referrer_discount_percent: settings.referrer_discount_percent,
      referee_discount_percent: settings.referee_discount_percent,
      referrer_coupon_validity_days: settings.referrer_coupon_validity_days,
      referee_coupon_validity_days: settings.referee_coupon_validity_days,
      min_order_amount: settings.min_order_amount,
      reward_after: settings.reward_after,
    }).eq("id", settings.id);
    if (error) toast.error(error.message);
    else toast.success("Referral settings saved");
    setSaving(false);
  };

  const totalReferrals = referrals.length;
  const completedReferrals = referrals.filter(r => r.status === "completed").length;

  if (loading) return <div className="text-center py-8 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Referral Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings && (
            <>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-medium">Referral Program</p>
                  <p className="text-sm text-muted-foreground">Enable or disable the referral system</p>
                </div>
                <Switch checked={settings.is_enabled} onCheckedChange={v => setSettings({ ...settings, is_enabled: v })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Referrer Discount %</Label>
                  <Input type="number" value={settings.referrer_discount_percent} onChange={e => setSettings({ ...settings, referrer_discount_percent: +e.target.value })} />
                </div>
                <div>
                  <Label>Referee (Welcome) Discount %</Label>
                  <Input type="number" value={settings.referee_discount_percent} onChange={e => setSettings({ ...settings, referee_discount_percent: +e.target.value })} />
                </div>
                <div>
                  <Label>Referrer Coupon Valid Days</Label>
                  <Input type="number" value={settings.referrer_coupon_validity_days} onChange={e => setSettings({ ...settings, referrer_coupon_validity_days: +e.target.value })} />
                </div>
                <div>
                  <Label>Referee Coupon Valid Days</Label>
                  <Input type="number" value={settings.referee_coupon_validity_days} onChange={e => setSettings({ ...settings, referee_coupon_validity_days: +e.target.value })} />
                </div>
                <div>
                  <Label>Min Order Amount</Label>
                  <Input type="number" value={settings.min_order_amount} onChange={e => setSettings({ ...settings, min_order_amount: +e.target.value })} />
                </div>
                <div>
                  <Label>Reward After</Label>
                  <Select value={settings.reward_after} onValueChange={v => setSettings({ ...settings, reward_after: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_order">First Completed Order</SelectItem>
                      <SelectItem value="any_order">Any Completed Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats & Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Referral Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-2xl font-bold text-primary">{totalReferrals}</p>
              <p className="text-xs text-muted-foreground">Total Referrals</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20 text-center">
              <p className="text-2xl font-bold text-green-500">{completedReferrals}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Referee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrals.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.referrer_id.slice(0, 8)}...</TableCell>
                  <TableCell className="font-mono text-xs">{r.referee_id.slice(0, 8)}...</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "completed" ? "default" : "secondary"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{format(new Date(r.created_at), "MMM d, yyyy")}</TableCell>
                </TableRow>
              ))}
              {referrals.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No referrals yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
