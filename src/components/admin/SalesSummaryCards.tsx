import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  CalendarDays,
  Clock,
  Minus,
} from "lucide-react";
import { SalesPeriodData } from "@/lib/adminDashboardApi";

interface SalesSummaryCardsProps {
  todaySales: SalesPeriodData;
  yesterdaySales: SalesPeriodData;
  last7DaysSales: SalesPeriodData;
  thisWeekSales: SalesPeriodData;
  pendingOrders: SalesPeriodData;
  todayVsYesterdayChange: number;
  weekVsWeekChange: number;
}

export function SalesSummaryCards({
  todaySales,
  yesterdaySales,
  last7DaysSales,
  thisWeekSales,
  pendingOrders,
  todayVsYesterdayChange,
  weekVsWeekChange,
}: SalesSummaryCardsProps) {
  const cards = [
    {
      title: "Today's Sales",
      revenue: todaySales.revenue,
      orders: todaySales.orders,
      change: todayVsYesterdayChange,
      changeLabel: "vs yesterday",
      icon: Calendar,
      colorClass: "from-emerald-500 to-emerald-600",
      shadowClass: "shadow-emerald-500/30",
    },
    {
      title: "Yesterday",
      revenue: yesterdaySales.revenue,
      orders: yesterdaySales.orders,
      change: null,
      changeLabel: null,
      icon: CalendarDays,
      colorClass: "from-blue-500 to-blue-600",
      shadowClass: "shadow-blue-500/30",
    },
    {
      title: "Last 7 Days",
      revenue: last7DaysSales.revenue,
      orders: last7DaysSales.orders,
      change: null,
      changeLabel: null,
      icon: CalendarDays,
      colorClass: "from-violet-500 to-violet-600",
      shadowClass: "shadow-violet-500/30",
    },
    {
      title: "This Week",
      revenue: thisWeekSales.revenue,
      orders: thisWeekSales.orders,
      change: weekVsWeekChange,
      changeLabel: "vs last week",
      icon: CalendarDays,
      colorClass: "from-indigo-500 to-indigo-600",
      shadowClass: "shadow-indigo-500/30",
    },
    {
      title: "Pending Orders",
      revenue: pendingOrders.revenue,
      orders: pendingOrders.orders,
      change: null,
      changeLabel: "Expected revenue",
      icon: Clock,
      colorClass: "from-amber-500 to-amber-600",
      shadowClass: "shadow-amber-500/30",
    },
  ];

  const renderChangeIndicator = (change: number | null, label: string | null) => {
    if (change === null && label === "Expected revenue") {
      return (
        <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
          <Clock className="h-3 w-3" />
          <span>{label}</span>
        </div>
      );
    }

    if (change === null) return null;

    if (change === 0) {
      return (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <Minus className="h-3 w-3" />
          <span>No change {label}</span>
        </div>
      );
    }

    const isPositive = change > 0;
    return (
      <div className={`flex items-center gap-1 mt-2 text-xs ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span>{isPositive ? "+" : ""}{change.toFixed(1)}% {label}</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <Card
          key={index}
          className="overflow-hidden bg-card/50 backdrop-blur-xl border-border hover:bg-card/60 transition-all duration-300 hover:scale-[1.02]"
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {card.title}
                </p>
                <h3 className="text-xl lg:text-2xl font-bold mt-1 text-foreground">
                  ₹{card.revenue.toLocaleString()}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {card.orders} order{card.orders !== 1 ? "s" : ""}
                </p>
                {renderChangeIndicator(card.change, card.changeLabel)}
              </div>
              <div
                className={`w-10 h-10 shrink-0 rounded-lg bg-gradient-to-br ${card.colorClass} flex items-center justify-center shadow-lg ${card.shadowClass}`}
              >
                <card.icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
