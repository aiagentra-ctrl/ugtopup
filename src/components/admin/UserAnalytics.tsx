import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, TrendingUp, ShoppingCart, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface AnalyticsData {
  totalUsers: number;
  newUsersThisMonth: number;
  totalRevenue: number;
  topProducts: { name: string; count: number }[];
  inactiveUsers: number;
  ordersByMonth: { month: string; count: number }[];
}

export function UserAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch profiles
        const { data: profiles } = await supabase.from('profiles').select('id, created_at');
        const { data: orders } = await supabase.from('product_orders').select('id, product_name, price, status, created_at, user_id');

        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const totalUsers = profiles?.length || 0;
        const newUsersThisMonth = profiles?.filter(p => new Date(p.created_at) >= monthAgo).length || 0;

        const completedOrders = orders?.filter(o => o.status === 'completed') || [];
        const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.price || 0), 0);

        // Top products
        const productCounts: Record<string, number> = {};
        orders?.forEach(o => { productCounts[o.product_name] = (productCounts[o.product_name] || 0) + 1; });
        const topProducts = Object.entries(productCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Inactive users (no orders in 30 days)
        const activeUserIds = new Set(orders?.filter(o => new Date(o.created_at) >= thirtyDaysAgo).map(o => o.user_id));
        const inactiveUsers = totalUsers - activeUserIds.size;

        // Orders by month (last 6 months)
        const ordersByMonth: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
          ordersByMonth[key] = 0;
        }
        orders?.forEach(o => {
          const d = new Date(o.created_at);
          const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
          if (ordersByMonth[key] !== undefined) ordersByMonth[key]++;
        });

        setData({
          totalUsers, newUsersThisMonth, totalRevenue, topProducts, inactiveUsers,
          ordersByMonth: Object.entries(ordersByMonth).map(([month, count]) => ({ month, count })),
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10b981', '#f59e0b', '#ef4444'];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (!data) return <p className="text-muted-foreground text-center">Failed to load analytics</p>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Users className="h-6 w-6 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold">{data.totalUsers}</p>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <TrendingUp className="h-6 w-6 mx-auto text-green-500 mb-1" />
          <p className="text-2xl font-bold">{data.newUsersThisMonth}</p>
          <p className="text-xs text-muted-foreground">New This Month</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <ShoppingCart className="h-6 w-6 mx-auto text-blue-500 mb-1" />
          <p className="text-2xl font-bold">₹{data.totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="h-6 w-6 mx-auto text-amber-500 mb-1" />
          <p className="text-2xl font-bold">{data.inactiveUsers}</p>
          <p className="text-xs text-muted-foreground">Inactive (30d)</p>
        </CardContent></Card>
      </div>

      {/* Orders Chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">Orders by Month</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.ordersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader><CardTitle className="text-base">Top Products</CardTitle></CardHeader>
        <CardContent>
          {data.topProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No order data</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: COLORS[i] + '20', color: COLORS[i] }}>{i + 1}</span>
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                  <Badge variant="outline">{p.count} orders</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
