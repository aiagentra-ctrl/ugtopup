import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ShoppingCart, CreditCard, Activity, AlertTriangle, Clock,
  CheckCircle, XCircle, TrendingUp, Users, Database, Download,
  RefreshCw, FileText, BarChart3,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fetchSupabaseLimits, type SupabaseLimits } from "@/lib/supabaseLimitsApi";

interface OrderStats {
  today: number;
  thisWeek: number;
  pending: number;
  failed: number;
  stalePending: any[];
  recentFailed: any[];
}

interface CreditStats {
  today: number;
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  stalePending: any[];
}

interface RecordCounts {
  orders: number;
  archived: number;
  notifications: number;
  chatbot: number;
  activity: number;
  coupons: number;
}

interface DailyReport {
  id: string;
  report_date: string;
  total_orders: number;
  total_revenue: number;
  total_credit_requests: number;
  total_chatbot_interactions: number;
  pending_orders: number;
  failed_orders: number;
  active_users: number;
  database_stats: any;
  created_at: string;
}

export function SystemHealthMonitor() {
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [creditStats, setCreditStats] = useState<CreditStats | null>(null);
  const [recordCounts, setRecordCounts] = useState<RecordCounts | null>(null);
  const [limits, setLimits] = useState<SupabaseLimits | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([
      loadOrderStats(),
      loadCreditStats(),
      loadRecordCounts(),
      loadLimits(),
      loadReports(),
    ]);
    setLoading(false);
  };

  const loadOrderStats = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const [today, week, pending, failed, stale, recentFailed] = await Promise.all([
      supabase.from("product_orders").select("id", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
      supabase.from("product_orders").select("id", { count: "exact", head: true })
        .gte("created_at", weekStart.toISOString()),
      supabase.from("product_orders").select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("product_orders").select("id", { count: "exact", head: true })
        .eq("status", "canceled")
        .gte("canceled_at", todayStart.toISOString()),
      supabase.from("product_orders")
        .select("id, order_number, user_email, product_name, created_at, price")
        .eq("status", "pending")
        .lt("created_at", twoHoursAgo)
        .order("created_at", { ascending: true })
        .limit(20),
      supabase.from("product_orders")
        .select("id, order_number, user_email, product_name, canceled_at, cancellation_reason, price")
        .eq("status", "canceled")
        .order("canceled_at", { ascending: false })
        .limit(10),
    ]);

    setOrderStats({
      today: today.count || 0,
      thisWeek: week.count || 0,
      pending: pending.count || 0,
      failed: failed.count || 0,
      stalePending: stale.data || [],
      recentFailed: recentFailed.data || [],
    });
  };

  const loadCreditStats = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [today, pending, approved, rejected, stale] = await Promise.all([
      supabase.from("payment_requests").select("id", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString()),
      supabase.from("payment_requests").select("id", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase.from("payment_requests").select("id", { count: "exact", head: true })
        .eq("status", "confirmed")
        .gte("reviewed_at", todayStart.toISOString()),
      supabase.from("payment_requests").select("id", { count: "exact", head: true })
        .eq("status", "rejected")
        .gte("reviewed_at", todayStart.toISOString()),
      supabase.from("payment_requests")
        .select("id, user_email, amount, credits, created_at")
        .eq("status", "pending")
        .lt("created_at", oneHourAgo)
        .order("created_at", { ascending: true })
        .limit(20),
    ]);

    setCreditStats({
      today: today.count || 0,
      pending: pending.count || 0,
      approvedToday: approved.count || 0,
      rejectedToday: rejected.count || 0,
      stalePending: stale.data || [],
    });
  };

  const loadRecordCounts = async () => {
    const [orders, archived, notifs, chatbot, activity, coupons] = await Promise.all([
      supabase.from("product_orders").select("id", { count: "exact", head: true }),
      supabase.from("archived_orders").select("id", { count: "exact", head: true }),
      supabase.from("notifications").select("id", { count: "exact", head: true }),
      supabase.from("chatbot_conversations").select("id", { count: "exact", head: true }),
      supabase.from("activity_logs").select("id", { count: "exact", head: true }),
      supabase.from("coupons").select("id", { count: "exact", head: true }),
    ]);

    setRecordCounts({
      orders: orders.count || 0,
      archived: archived.count || 0,
      notifications: notifs.count || 0,
      chatbot: chatbot.count || 0,
      activity: activity.count || 0,
      coupons: coupons.count || 0,
    });
  };

  const loadLimits = async () => {
    const data = await fetchSupabaseLimits();
    setLimits(data);
  };

  const loadReports = async () => {
    const { data } = await supabase
      .from("system_daily_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(30);
    if (data) setReports(data as any);
  };

  const exportReports = () => {
    const csv = [
      "Date,Orders,Revenue,Credit Requests,Chatbot,Pending Orders,Failed Orders,Active Users",
      ...reports.map(r =>
        `${r.report_date},${r.total_orders},${r.total_revenue},${r.total_credit_requests},${r.total_chatbot_interactions},${r.pending_orders},${r.failed_orders},${r.active_users}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-reports-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRecordBarColor = (count: number, threshold: number) => {
    const pct = (count / threshold) * 100;
    if (pct >= 90) return "bg-destructive";
    if (pct >= 70) return "bg-yellow-500";
    return "bg-primary";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Real-time platform monitoring</p>
        <Button variant="outline" size="sm" onClick={loadAll} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingCart className="h-4 w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="credits" className="gap-2">
            <CreditCard className="h-4 w-4" /> Credits
          </TabsTrigger>
          <TabsTrigger value="health" className="gap-2">
            <Activity className="h-4 w-4" /> System Health
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <FileText className="h-4 w-4" /> Daily Reports
          </TabsTrigger>
        </TabsList>

        {/* ORDER MONITOR TAB */}
        <TabsContent value="orders" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={ShoppingCart} label="Orders Today" value={orderStats?.today || 0} />
            <StatCard icon={TrendingUp} label="This Week" value={orderStats?.thisWeek || 0} />
            <StatCard icon={Clock} label="Pending" value={orderStats?.pending || 0}
              variant={orderStats?.pending && orderStats.pending > 0 ? "warning" : "default"} />
            <StatCard icon={XCircle} label="Failed Today" value={orderStats?.failed || 0}
              variant={orderStats?.failed && orderStats.failed > 3 ? "destructive" : "default"} />
          </div>

          {orderStats?.stalePending && orderStats.stalePending.length > 0 && (
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" /> Orders Pending &gt; 2 Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Waiting</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderStats.stalePending.map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                        <TableCell className="text-sm">{o.user_email}</TableCell>
                        <TableCell className="text-sm">{o.product_name}</TableCell>
                        <TableCell>Rs.{o.price}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-yellow-600">
                            {formatDistanceToNow(new Date(o.created_at), { addSuffix: false })}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {orderStats?.recentFailed && orderStats.recentFailed.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Failed/Canceled Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderStats.recentFailed.map((o: any) => (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                        <TableCell className="text-sm">{o.user_email}</TableCell>
                        <TableCell className="text-sm">{o.product_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {o.cancellation_reason || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {o.canceled_at ? format(new Date(o.canceled_at), "MMM dd, HH:mm") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* CREDIT MONITOR TAB */}
        <TabsContent value="credits" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={CreditCard} label="Requests Today" value={creditStats?.today || 0} />
            <StatCard icon={Clock} label="Pending" value={creditStats?.pending || 0}
              variant={creditStats?.pending && creditStats.pending > 0 ? "warning" : "default"} />
            <StatCard icon={CheckCircle} label="Approved Today" value={creditStats?.approvedToday || 0} />
            <StatCard icon={XCircle} label="Rejected Today" value={creditStats?.rejectedToday || 0} />
          </div>

          {creditStats?.stalePending && creditStats.stalePending.length > 0 && (
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                  <AlertTriangle className="h-5 w-5" /> Credit Requests Pending &gt; 1 Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Waiting</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {creditStats.stalePending.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.user_email}</TableCell>
                        <TableCell>Rs.{r.amount}</TableCell>
                        <TableCell>{r.credits}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-yellow-600">
                            {formatDistanceToNow(new Date(r.created_at), { addSuffix: false })}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* SYSTEM HEALTH TAB */}
        <TabsContent value="health" className="space-y-6">
          {/* Storage */}
          {limits && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StorageCard title="File Storage" used={limits.storage.used_mb} limit={limits.storage.limit_mb} pct={limits.storage.percentage} />
              <StorageCard title="Database" used={limits.database.used_mb} limit={limits.database.limit_mb} pct={limits.database.percentage} />
              <StorageCard title="Payment Screenshots" used={limits.payment_screenshots_bucket.used_mb} limit={limits.payment_screenshots_bucket.limit_mb} pct={limits.payment_screenshots_bucket.percentage} />
            </div>
          )}

          {/* Record counts */}
          {recordCounts && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-5 w-5" /> Record Counts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Active Orders", count: recordCounts.orders, threshold: 10000 },
                  { label: "Archived Orders", count: recordCounts.archived, threshold: 50000 },
                  { label: "Notifications", count: recordCounts.notifications, threshold: 5000 },
                  { label: "Chatbot Logs", count: recordCounts.chatbot, threshold: 10000 },
                  { label: "Activity Logs", count: recordCounts.activity, threshold: 10000 },
                  { label: "Coupons", count: recordCounts.coupons, threshold: 5000 },
                ].map(item => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.label}</span>
                      <span className="text-muted-foreground">
                        {item.count.toLocaleString()} / {item.threshold.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getRecordBarColor(item.count, item.threshold)}`}
                        style={{ width: `${Math.min((item.count / item.threshold) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard icon={Users} label="Total Users" value={recordCounts?.orders !== undefined ? (reports[0]?.active_users || 0) : 0} />
            <StatCard icon={BarChart3} label="Total Active Orders" value={recordCounts?.orders || 0} />
            <StatCard icon={Database} label="Total Archived" value={recordCounts?.archived || 0} />
          </div>
        </TabsContent>

        {/* DAILY REPORTS TAB */}
        <TabsContent value="reports" className="space-y-6">
          {reports.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={ShoppingCart} label="Today's Orders" value={reports[0]?.total_orders || 0} />
              <StatCard icon={TrendingUp} label="Today's Revenue" value={`Rs.${reports[0]?.total_revenue || 0}`} />
              <StatCard icon={CreditCard} label="Credit Requests" value={reports[0]?.total_credit_requests || 0} />
              <StatCard icon={Activity} label="Chatbot Chats" value={reports[0]?.total_chatbot_interactions || 0} />
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportReports} disabled={reports.length === 0} className="gap-2">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>

          {reports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No daily reports yet. Reports are generated automatically during cleanup.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Chatbot</TableHead>
                      <TableHead>Pending</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Users</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{format(new Date(r.report_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{r.total_orders}</TableCell>
                        <TableCell>Rs.{r.total_revenue}</TableCell>
                        <TableCell>{r.total_credit_requests}</TableCell>
                        <TableCell>{r.total_chatbot_interactions}</TableCell>
                        <TableCell>
                          {r.pending_orders > 0 ? (
                            <Badge variant="outline" className="text-yellow-600">{r.pending_orders}</Badge>
                          ) : 0}
                        </TableCell>
                        <TableCell>
                          {r.failed_orders > 0 ? (
                            <Badge variant="destructive">{r.failed_orders}</Badge>
                          ) : 0}
                        </TableCell>
                        <TableCell>{r.active_users}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, variant = "default" }: {
  icon: any;
  label: string;
  value: number | string;
  variant?: "default" | "warning" | "destructive";
}) {
  const borderClass = variant === "warning"
    ? "border-yellow-500/30"
    : variant === "destructive"
    ? "border-destructive/30"
    : "";

  return (
    <Card className={borderClass}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        <p className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</p>
      </CardContent>
    </Card>
  );
}

function StorageCard({ title, used, limit, pct }: {
  title: string;
  used: number;
  limit: number;
  pct: number;
}) {
  const color = pct >= 90 ? "text-destructive" : pct >= 70 ? "text-yellow-600" : "text-primary";

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium mb-2">{title}</h3>
        <div className="flex justify-between text-sm mb-1">
          <span>{used.toFixed(1)} MB</span>
          <span className="text-muted-foreground">{limit} MB</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-yellow-500" : "bg-primary"}`}
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <p className={`text-xs mt-1 ${color}`}>{pct.toFixed(1)}% used</p>
      </CardContent>
    </Card>
  );
}
