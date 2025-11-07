import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchDashboardKPIs,
  fetchRevenueData,
  fetchOrdersData,
  fetchCategoryDistribution,
  fetchRecentActivity,
  DashboardKPIs,
} from "@/lib/adminDashboardApi";
import { Badge } from "@/components/ui/badge";

export function EnhancedDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    end: new Date(),
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpisData, revenue, orders, categories, activity] = await Promise.all([
        fetchDashboardKPIs(dateRange.start, dateRange.end),
        fetchRevenueData(dateRange.start, dateRange.end),
        fetchOrdersData(dateRange.start, dateRange.end),
        fetchCategoryDistribution(dateRange.start, dateRange.end),
        fetchRecentActivity(10),
      ]);

      setKpis(kpisData);
      setRevenueData(revenue);
      setOrdersData(orders);
      setCategoryData(categories);
      setRecentActivity(activity);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Real-time subscriptions
    const ordersChannel = supabase
      .channel("dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "product_orders" }, loadDashboardData)
      .subscribe();

    const paymentsChannel = supabase
      .channel("dashboard-payments")
      .on("postgres_changes", { event: "*", schema: "public", table: "payment_requests" }, loadDashboardData)
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, []);

  if (loading || !kpis) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `₹${kpis.totalRevenue.toLocaleString()}`,
      change: kpis.revenueChange,
      icon: DollarSign,
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Total Orders",
      value: kpis.totalOrders.toString(),
      change: kpis.ordersChange,
      icon: ShoppingBag,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Total Users",
      value: kpis.totalUsers.toString(),
      change: kpis.usersChange,
      icon: Users,
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Pending Requests",
      value: kpis.pendingRequests.toString(),
      change: 0,
      icon: Clock,
      gradient: "from-orange-500 to-orange-600",
    },
    {
      title: "Conversion Rate",
      value: `${kpis.conversionRate.toFixed(1)}%`,
      change: 0,
      icon: TrendingUp,
      gradient: "from-indigo-500 to-indigo-600",
    },
    {
      title: "Avg Order Value",
      value: `₹${kpis.avgOrderValue.toFixed(0)}`,
      change: 0,
      icon: DollarSign,
      gradient: "from-pink-500 to-pink-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow">
            <div className={`h-2 bg-gradient-to-r ${kpi.gradient}`} />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-2">{kpi.value}</h3>
                  {kpi.change !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 text-sm ${kpi.change > 0 ? "text-green-600" : "text-red-600"}`}>
                      {kpi.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span>{Math.abs(kpi.change).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <div className={`p-4 rounded-full bg-gradient-to-br ${kpi.gradient}`}>
                  <kpi.icon className="h-8 w-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }}
                  formatter={(value: any) => [`₹${value}`, "Revenue"]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Orders Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
                <Legend />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                <Bar dataKey="confirmed" fill="#10b981" name="Confirmed" />
                <Bar dataKey="canceled" fill="#ef4444" name="Canceled" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Category Distribution + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Product Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Activity</CardTitle>
            <Button size="sm" variant="outline" onClick={loadDashboardData}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 font-medium">{activity.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
