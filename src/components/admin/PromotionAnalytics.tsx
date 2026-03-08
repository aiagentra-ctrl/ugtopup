import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Ticket, DollarSign, Users } from "lucide-react";

interface AnalyticsData {
  totalCouponsIssued: number;
  totalCouponsUsed: number;
  totalDiscount: number;
  topRules: { name: string; uses: number; discount: number }[];
}

export function PromotionAnalytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalCouponsIssued: 0,
    totalCouponsUsed: 0,
    totalDiscount: 0,
    topRules: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);

      const [couponsRes, analyticsRes, rulesRes] = await Promise.all([
        supabase.from("coupons").select("id, is_used", { count: "exact" }),
        supabase.from("promotion_analytics").select("*"),
        supabase.from("coupon_rules").select("id, name, total_used"),
      ]);

      const coupons = couponsRes.data || [];
      const analytics = (analyticsRes.data || []) as any[];
      const rules = (rulesRes.data || []) as any[];

      const totalDiscount = analytics.reduce((sum: number, a: any) => sum + (a.discount_amount || 0), 0);

      // Build top rules chart data
      const ruleMap = new Map<string, { name: string; uses: number; discount: number }>();
      for (const a of analytics) {
        if (a.coupon_rule_id) {
          const rule = rules.find(r => r.id === a.coupon_rule_id);
          const name = rule?.name || "Unknown";
          const existing = ruleMap.get(a.coupon_rule_id) || { name, uses: 0, discount: 0 };
          existing.uses += 1;
          existing.discount += a.discount_amount || 0;
          ruleMap.set(a.coupon_rule_id, existing);
        }
      }

      setData({
        totalCouponsIssued: coupons.length,
        totalCouponsUsed: coupons.filter((c: any) => c.is_used).length,
        totalDiscount,
        topRules: Array.from(ruleMap.values()).sort((a, b) => b.uses - a.uses).slice(0, 10),
      });
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  if (loading) return <p className="text-center py-8 text-muted-foreground">Loading analytics...</p>;

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Ticket className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{data.totalCouponsIssued}</p>
                <p className="text-sm text-muted-foreground">Coupons Issued</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{data.totalCouponsUsed}</p>
                <p className="text-sm text-muted-foreground">Coupons Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">₹{data.totalDiscount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Discounts Given</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">
                  {data.totalCouponsIssued > 0 ? Math.round((data.totalCouponsUsed / data.totalCouponsIssued) * 100) : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Redemption Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Campaigns Chart */}
      {data.topRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topRules}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="uses" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
