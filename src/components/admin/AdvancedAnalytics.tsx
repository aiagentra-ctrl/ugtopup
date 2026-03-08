import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe, Eye, Users, TrendingUp, Activity, Clock,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Monitor
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend
} from "recharts";
import { format, subDays, startOfDay, differenceInDays } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

type DateRange = "today" | "7d" | "30d";

function getDateFrom(range: DateRange): string {
  const days = range === "today" ? 0 : range === "7d" ? 7 : 30;
  return startOfDay(subDays(new Date(), days)).toISOString();
}

export function AdvancedAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [loading, setLoading] = useState(true);
  const [pageViews, setPageViews] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [realtimeCount, setRealtimeCount] = useState(0);
  const [realtimePages, setRealtimePages] = useState<{ page: string; count: number }[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const from = getDateFrom(dateRange);

    const [pvRes, sessRes, rtRes, profileRes, orderRes] = await Promise.all([
      supabase.from("page_views").select("*").gte("created_at", from).order("created_at", { ascending: false }).limit(5000),
      supabase.from("visitor_sessions").select("*").gte("started_at", from).order("started_at", { ascending: false }).limit(5000),
      supabase.from("visitor_sessions").select("session_id, last_active_at").gte("last_active_at", new Date(Date.now() - 5 * 60 * 1000).toISOString()),
      supabase.from("profiles").select("id, created_at").limit(10000),
      supabase.from("product_orders").select("id, user_id, created_at, status").limit(10000),
    ]);

    setPageViews(pvRes.data || []);
    setSessions(sessRes.data || []);
    setRealtimeCount(rtRes.data?.length || 0);
    setProfiles(profileRes.data || []);
    setOrders(orderRes.data || []);

    // Real-time pages from recent page views
    const recentPvRes = await supabase
      .from("page_views")
      .select("page_path")
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());
    
    if (recentPvRes.data) {
      const pageCounts: Record<string, number> = {};
      recentPvRes.data.forEach(pv => {
        pageCounts[pv.page_path] = (pageCounts[pv.page_path] || 0) + 1;
      });
      setRealtimePages(
        Object.entries(pageCounts)
          .map(([page, count]) => ({ page, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  // Computed metrics
  const totalPageViews = pageViews.length;
  const totalSessions = sessions.length;
  const bounceRate = totalSessions > 0
    ? Math.round((sessions.filter(s => s.is_bounce).length / totalSessions) * 100)
    : 0;
  const avgPagesPerSession = totalSessions > 0
    ? (sessions.reduce((sum, s) => sum + (s.page_count || 1), 0) / totalSessions).toFixed(1)
    : "0";

  // Traffic source distribution
  const trafficSources = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.traffic_source || "direct"] = (acc[s.traffic_source || "direct"] || 0) + 1;
    return acc;
  }, {});
  const trafficPieData = Object.entries(trafficSources).map(([name, value]) => ({ name, value }));

  // Top referrers
  const referrerCounts = sessions
    .filter(s => s.referrer && s.referrer.length > 0)
    .reduce<Record<string, number>>((acc, s) => {
      try {
        const host = new URL(s.referrer).hostname;
        acc[host] = (acc[host] || 0) + 1;
      } catch {
        acc[s.referrer] = (acc[s.referrer] || 0) + 1;
      }
      return acc;
    }, {});
  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Daily page views chart
  const dailyViews = pageViews.reduce<Record<string, number>>((acc, pv) => {
    const day = format(new Date(pv.created_at), "MMM dd");
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const dailyViewsData = Object.entries(dailyViews)
    .map(([date, views]) => ({ date, views }))
    .reverse();

  // Top pages
  const pageCounts = pageViews.reduce<Record<string, number>>((acc, pv) => {
    acc[pv.page_path] = (acc[pv.page_path] || 0) + 1;
    return acc;
  }, {});
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Sessions per day chart
  const dailySessions = sessions.reduce<Record<string, number>>((acc, s) => {
    const day = format(new Date(s.started_at), "MMM dd");
    acc[day] = (acc[day] || 0) + 1;
    return acc;
  }, {});
  const dailySessionsData = Object.entries(dailySessions)
    .map(([date, count]) => ({ date, sessions: count }))
    .reverse();

  // New vs returning (has user_id = returning, no user_id = anonymous/new)
  const returningVisitors = sessions.filter(s => s.user_id).length;
  const newVisitors = sessions.filter(s => !s.user_id).length;

  // Retention: monthly new users vs active orderers
  const monthlyRetention = (() => {
    const months: Record<string, { newUsers: number; activeUsers: Set<string>; totalUsers: Set<string> }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(d, "MMM yyyy");
      months[key] = { newUsers: 0, activeUsers: new Set(), totalUsers: new Set() };
    }

    profiles.forEach(p => {
      const key = format(new Date(p.created_at), "MMM yyyy");
      if (months[key]) months[key].newUsers++;
    });

    orders.forEach(o => {
      const key = format(new Date(o.created_at), "MMM yyyy");
      if (months[key]) {
        months[key].activeUsers.add(o.user_id);
        months[key].totalUsers.add(o.user_id);
      }
    });

    return Object.entries(months).map(([month, data]) => ({
      month,
      newUsers: data.newUsers,
      activeUsers: data.activeUsers.size,
    }));
  })();

  // Churned users (ordered before 30d ago, no orders in last 30d)
  const thirtyDaysAgo = subDays(new Date(), 30);
  const recentOrderUsers = new Set(
    orders.filter(o => new Date(o.created_at) >= thirtyDaysAgo).map(o => o.user_id)
  );
  const olderOrderUsers = new Set(
    orders.filter(o => new Date(o.created_at) < thirtyDaysAgo).map(o => o.user_id)
  );
  const churnedUsers = [...olderOrderUsers].filter(u => !recentOrderUsers.has(u)).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Real-Time Widget */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Monitor className="h-8 w-8 text-primary" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{realtimeCount}</p>
                <p className="text-sm text-muted-foreground">Active visitors (last 5 min)</p>
              </div>
            </div>
            {realtimePages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {realtimePages.map(rp => (
                  <Badge key={rp.page} variant="secondary" className="text-xs">
                    {rp.page} ({rp.count})
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              {(["today", "7d", "30d"] as DateRange[]).map(r => (
                <Button
                  key={r}
                  size="sm"
                  variant={dateRange === r ? "default" : "outline"}
                  onClick={() => setDateRange(r)}
                >
                  {r === "today" ? "Today" : r === "7d" ? "7 Days" : "30 Days"}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-primary/70" />
              <div>
                <p className="text-2xl font-bold">{totalPageViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Page Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-chart-2/70" />
              <div>
                <p className="text-2xl font-bold">{totalSessions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-chart-3/70" />
              <div>
                <p className="text-2xl font-bold">{avgPagesPerSession}</p>
                <p className="text-xs text-muted-foreground">Pages/Session</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className={`h-8 w-8 ${bounceRate > 60 ? 'text-destructive/70' : 'text-chart-4/70'}`} />
              <div>
                <p className="text-2xl font-bold">{bounceRate}%</p>
                <p className="text-xs text-muted-foreground">Bounce Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="traffic"><Globe className="h-4 w-4 mr-1.5 hidden sm:inline" />Traffic</TabsTrigger>
          <TabsTrigger value="pages"><Eye className="h-4 w-4 mr-1.5 hidden sm:inline" />Pages</TabsTrigger>
          <TabsTrigger value="behavior"><Activity className="h-4 w-4 mr-1.5 hidden sm:inline" />Behavior</TabsTrigger>
          <TabsTrigger value="retention"><Users className="h-4 w-4 mr-1.5 hidden sm:inline" />Retention</TabsTrigger>
        </TabsList>

        {/* Traffic Sources Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Traffic Source Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {trafficPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={trafficPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {trafficPieData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-12">No traffic data yet</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top Referrers</CardTitle>
              </CardHeader>
              <CardContent>
                {topReferrers.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Visits</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topReferrers.map(([source, count]) => (
                        <TableRow key={source}>
                          <TableCell className="font-medium truncate max-w-[200px]">{source}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-12">No referral data yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Page Views Tab */}
        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Daily Page Views</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyViewsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyViewsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">No page view data yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Most Visited Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topPages.map(([page, count]) => (
                    <TableRow key={page}>
                      <TableCell className="font-medium">{page}</TableCell>
                      <TableCell className="text-right">{count}</TableCell>
                      <TableCell className="text-right">
                        {totalPageViews > 0 ? ((count / totalPageViews) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visitor Behavior Tab */}
        <TabsContent value="behavior" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto text-primary/60 mb-2" />
                <p className="text-2xl font-bold">{returningVisitors}</p>
                <p className="text-xs text-muted-foreground">Returning (Logged In)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ArrowUpRight className="h-8 w-8 mx-auto text-chart-2/60 mb-2" />
                <p className="text-2xl font-bold">{newVisitors}</p>
                <p className="text-xs text-muted-foreground">Anonymous Visitors</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ArrowDownRight className={`h-8 w-8 mx-auto mb-2 ${bounceRate > 60 ? 'text-destructive/60' : 'text-chart-4/60'}`} />
                <p className="text-2xl font-bold">{bounceRate}%</p>
                <p className="text-xs text-muted-foreground">Bounce Rate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sessions Per Day</CardTitle>
            </CardHeader>
            <CardContent>
              {dailySessionsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailySessionsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                    />
                    <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-center py-12">No session data yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto text-primary/60 mb-2" />
                <p className="text-2xl font-bold">{profiles.length}</p>
                <p className="text-xs text-muted-foreground">Total Registered Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Activity className="h-8 w-8 mx-auto text-chart-2/60 mb-2" />
                <p className="text-2xl font-bold">{recentOrderUsers.size}</p>
                <p className="text-xs text-muted-foreground">Active (Last 30d)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <ArrowDownRight className="h-8 w-8 mx-auto text-destructive/60 mb-2" />
                <p className="text-2xl font-bold">{churnedUsers}</p>
                <p className="text-xs text-muted-foreground">Churned Users</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Monthly User Activity</CardTitle>
              <CardDescription>New registrations vs active orderers per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRetention}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="newUsers" name="New Users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="activeUsers" name="Active Orderers" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Retention Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">New Users</TableHead>
                    <TableHead className="text-right">Active Orderers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyRetention.map(row => (
                    <TableRow key={row.month}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-right">{row.newUsers}</TableCell>
                      <TableCell className="text-right">{row.activeUsers}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
