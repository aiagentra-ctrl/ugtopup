import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { SalesPeriodData } from "@/lib/adminDashboardApi";

interface SalesComparisonChartProps {
  todaySales: SalesPeriodData;
  yesterdaySales: SalesPeriodData;
  thisWeekSales: SalesPeriodData;
  lastWeekSales: SalesPeriodData;
  todayVsYesterdayChange: number;
  weekVsWeekChange: number;
}

export function SalesComparisonChart({
  todaySales,
  yesterdaySales,
  thisWeekSales,
  lastWeekSales,
  todayVsYesterdayChange,
  weekVsWeekChange,
}: SalesComparisonChartProps) {
  const dailyComparisonData = [
    {
      name: "Yesterday",
      Revenue: yesterdaySales.revenue,
      Orders: yesterdaySales.orders,
    },
    {
      name: "Today",
      Revenue: todaySales.revenue,
      Orders: todaySales.orders,
    },
  ];

  const weeklyComparisonData = [
    {
      name: "Last Week",
      Revenue: lastWeekSales.revenue,
      Orders: lastWeekSales.orders,
    },
    {
      name: "This Week",
      Revenue: thisWeekSales.revenue,
      Orders: thisWeekSales.orders,
    },
  ];

  const renderChangeIndicator = (change: number, label: string) => {
    if (change === 0) {
      return (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Minus className="h-4 w-4" />
          <span>No change</span>
        </div>
      );
    }

    const isPositive = change > 0;
    return (
      <div className={`flex items-center gap-2 text-sm ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span className="font-medium">
          {isPositive ? "+" : ""}{change.toFixed(1)}% {label}
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      {/* Today vs Yesterday */}
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-lg">Today vs Yesterday</CardTitle>
            {renderChangeIndicator(todayVsYesterdayChange, "revenue")}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyComparisonData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value: number, name: string) => [
                  name === "Revenue" ? `₹${value.toLocaleString()}` : value,
                  name,
                ]}
              />
              <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
              <Bar yAxisId="left" dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-8 mt-2 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Today</p>
              <p className="font-semibold text-foreground">₹{todaySales.revenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{todaySales.orders} orders</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Yesterday</p>
              <p className="font-semibold text-foreground">₹{yesterdaySales.revenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{yesterdaySales.orders} orders</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* This Week vs Last Week */}
      <Card className="bg-card/50 backdrop-blur-xl border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-foreground text-lg">This Week vs Last Week</CardTitle>
            {renderChangeIndicator(weekVsWeekChange, "revenue")}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyComparisonData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  color: "hsl(var(--popover-foreground))",
                }}
                formatter={(value: number, name: string) => [
                  name === "Revenue" ? `₹${value.toLocaleString()}` : value,
                  name,
                ]}
              />
              <Legend wrapperStyle={{ color: "hsl(var(--foreground))" }} />
              <Bar yAxisId="left" dataKey="Revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="Orders" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-8 mt-2 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">This Week</p>
              <p className="font-semibold text-foreground">₹{thisWeekSales.revenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{thisWeekSales.orders} orders</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Last Week</p>
              <p className="font-semibold text-foreground">₹{lastWeekSales.revenue.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{lastWeekSales.orders} orders</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
