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
  fetchAllSalesPeriods,
  DashboardKPIs,
  SalesPeriodData,
} from "@/lib/adminDashboardApi";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { SalesSummaryCards } from "./SalesSummaryCards";
import { SalesComparisonChart } from "./SalesComparisonChart";

interface SalesData {
  todaySales: SalesPeriodData;
  yesterdaySales: SalesPeriodData;
  last7DaysSales: SalesPeriodData;
  thisWeekSales: SalesPeriodData;
  lastWeekSales: SalesPeriodData;
  pendingOrders: SalesPeriodData;
  todayVsYesterdayChange: number;
  weekVsWeekChange: number;
  last7VsPrev7Change: number;
}

const defaultSalesPeriod: SalesPeriodData = { period: '', orders: 0, revenue: 0, avgOrderValue: 0 };

export function EnhancedDashboard() {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [salesData, setSalesData] = useState<SalesData>({
    todaySales: defaultSalesPeriod,
    yesterdaySales: defaultSalesPeriod,
    last7DaysSales: defaultSalesPeriod,
    thisWeekSales: defaultSalesPeriod,
    lastWeekSales: defaultSalesPeriod,
    pendingOrders: defaultSalesPeriod,
    todayVsYesterdayChange: 0,
    weekVsWeekChange: 0,
    last7VsPrev7Change: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [kpisData, salesPeriods, revenue, orders, categories, activity] = await Promise.all([
        fetchDashboardKPIs(dateRange.start, dateRange.end),
        fetchAllSalesPeriods(),
        fetchRevenueData(dateRange.start, dateRange.end),
        fetchOrdersData(dateRange.start, dateRange.end),
        fetchCategoryDistribution(dateRange.start, dateRange.end),
        fetchRecentActivity(10),
      ]);

      setKpis(kpisData);
      setSalesData(salesPeriods);
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
    return <DashboardSkeleton />;
  }

  const kpiCards = [
    {
      title: "Total Revenue",
      value: `₹${kpis.totalRevenue.toLocaleString()}`,
      change: kpis.revenueChange,
      icon: DollarSign,
      colorClass: "from-green-500/80 to-green-600/80",
      shadowClass: "shadow-green-500/30",
    },
    {
      title: "Total Orders",
      value: kpis.totalOrders.toString(),
      change: kpis.ordersChange,
      icon: ShoppingBag,
      colorClass: "from-blue-500/80 to-blue-600/80",
      shadowClass: "shadow-blue-500/30",
    },
    {
      title: "Total Users",
      value: kpis.totalUsers.toString(),
      change: kpis.usersChange,
      icon: Users,
      colorClass: "from-purple-500/80 to-purple-600/80",
      shadowClass: "shadow-purple-500/30",
    },
    {
      title: "Pending Requests",
      value: kpis.pendingRequests.toString(),
      change: 0,
      icon: Clock,
      colorClass: "from-orange-500/80 to-orange-600/80",
      shadowClass: "shadow-orange-500/30",
    },
    {
      title: "Conversion Rate",
      value: `${kpis.conversionRate.toFixed(1)}%`,
      change: 0,
      icon: TrendingUp,
      colorClass: "from-indigo-500/80 to-indigo-600/80",
      shadowClass: "shadow-indigo-500/30",
    },
    {
      title: "Avg Order Value",
      value: `₹${kpis.avgOrderValue.toFixed(0)}`,
      change: 0,
      icon: DollarSign,
      colorClass: "from-pink-500/80 to-pink-600/80",
      shadowClass: "shadow-pink-500/30",
    },
  ];

  return (
    <div className="space-y-4 lg:space-y-6 animate-fade-in">
      {/* Sales Overview Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Sales Overview</h2>
          <Button size="sm" variant="outline" onClick={loadDashboardData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        
        {/* Sales Summary Cards */}
        <SalesSummaryCards
          todaySales={salesData.todaySales}
          yesterdaySales={salesData.yesterdaySales}
          last7DaysSales={salesData.last7DaysSales}
          thisWeekSales={salesData.thisWeekSales}
          pendingOrders={salesData.pendingOrders}
          todayVsYesterdayChange={salesData.todayVsYesterdayChange}
          weekVsWeekChange={salesData.weekVsWeekChange}
        />

        {/* Sales Comparison Charts */}
        <SalesComparisonChart
          todaySales={salesData.todaySales}
          yesterdaySales={salesData.yesterdaySales}
          thisWeekSales={salesData.thisWeekSales}
          lastWeekSales={salesData.lastWeekSales}
          todayVsYesterdayChange={salesData.todayVsYesterdayChange}
          weekVsWeekChange={salesData.weekVsWeekChange}
        />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {kpiCards.map((kpi, index) => (
          <Card 
            key={index} 
            className="overflow-hidden bg-card/50 backdrop-blur-xl border-border hover:bg-card/60 transition-all duration-300 hover:scale-[1.02]"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <h3 className="text-2xl lg:text-3xl font-bold mt-2 text-foreground truncate">{kpi.value}</h3>
                  {kpi.change !== 0 && (
                    <div className={`flex items-center gap-1 mt-2 text-xs lg:text-sm ${kpi.change > 0 ? "text-green-400" : "text-red-400"}`}>
                      {kpi.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span>{Math.abs(kpi.change).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 shrink-0 rounded-lg bg-gradient-to-br ${kpi.colorClass} flex items-center justify-center shadow-lg ${kpi.shadowClass}`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Revenue Chart */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Revenue Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                  formatter={(value: any) => [`₹${value}`, "Revenue"]}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Orders Chart */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Orders Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                <Bar dataKey="confirmed" fill="#10b981" name="Confirmed" />
                <Bar dataKey="canceled" fill="#ef4444" name="Canceled" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Category Distribution + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Category Distribution */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Product Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--popover-foreground))'
                  }}
                />
                <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/50 backdrop-blur-xl border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Recent Activity</CardTitle>
            <Button size="sm" variant="ghost" onClick={loadDashboardData} className="hover:bg-muted">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      activity.type === 'order' ? 'bg-blue-500' :
                      activity.type === 'payment' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">{activity.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
