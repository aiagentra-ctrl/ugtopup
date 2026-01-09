import { supabase } from "@/integrations/supabase/client";

export interface DashboardKPIs {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  pendingRequests: number;
  conversionRate: number;
  avgOrderValue: number;
  revenueChange: number;
  ordersChange: number;
  usersChange: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export interface OrdersDataPoint {
  date: string;
  pending: number;
  confirmed: number;
  canceled: number;
}

export interface CategoryDistribution {
  name: string;
  value: number;
  fill: string;
}

export interface RecentActivityItem {
  id: string;
  timestamp: string;
  type: string;
  description: string;
  actor: string;
}

export interface SalesPeriodData {
  period: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
}

export interface SalesComparison {
  current: SalesPeriodData;
  previous: SalesPeriodData;
  orderChange: number;
  revenueChange: number;
}

/**
 * Fetch dashboard KPIs with date range filtering
 */
export const fetchDashboardKPIs = async (
  startDate?: Date,
  endDate?: Date
): Promise<DashboardKPIs> => {
  try {
    // Build date filter
    const dateFilter = startDate && endDate 
      ? `created_at.gte.${startDate.toISOString()}&created_at.lte.${endDate.toISOString()}`
      : '';

    // Fetch confirmed orders
    const { data: orders, error: ordersError } = await supabase
      .from('product_orders')
      .select('price, status, created_at')
      .gte('created_at', startDate?.toISOString() || '2000-01-01')
      .lte('created_at', endDate?.toISOString() || new Date().toISOString());

    if (ordersError) throw ordersError;

    // Calculate metrics
    const confirmedOrders = orders?.filter(o => o.status === 'confirmed') || [];
    const totalRevenue = confirmedOrders.reduce((sum, o) => sum + Number(o.price), 0);
    const totalOrders = orders?.length || 0;
    const avgOrderValue = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0;
    const conversionRate = totalOrders > 0 ? (confirmedOrders.length / totalOrders) * 100 : 0;

    // Fetch total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Fetch pending payment requests
    const { count: pendingRequests } = await supabase
      .from('payment_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Calculate previous period for changes
    const periodLength = endDate && startDate 
      ? endDate.getTime() - startDate.getTime()
      : 30 * 24 * 60 * 60 * 1000; // 30 days default

    const prevStartDate = new Date((startDate?.getTime() || Date.now()) - periodLength);
    const prevEndDate = startDate || new Date();

    const { data: prevOrders } = await supabase
      .from('product_orders')
      .select('price, status')
      .gte('created_at', prevStartDate.toISOString())
      .lte('created_at', prevEndDate.toISOString());

    const prevConfirmed = prevOrders?.filter(o => o.status === 'confirmed') || [];
    const prevRevenue = prevConfirmed.reduce((sum, o) => sum + Number(o.price), 0);
    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const ordersChange = prevOrders && prevOrders.length > 0 
      ? ((totalOrders - prevOrders.length) / prevOrders.length) * 100 
      : 0;

    return {
      totalRevenue,
      totalOrders,
      totalUsers: totalUsers || 0,
      pendingRequests: pendingRequests || 0,
      conversionRate,
      avgOrderValue,
      revenueChange,
      ordersChange,
      usersChange: 0, // Would need user history to calculate
    };
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    throw error;
  }
};

/**
 * Fetch revenue data over time
 */
export const fetchRevenueData = async (
  startDate: Date,
  endDate: Date
): Promise<RevenueDataPoint[]> => {
  try {
    const { data, error } = await supabase
      .from('product_orders')
      .select('price, created_at, status')
      .eq('status', 'confirmed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date
    const revenueMap = new Map<string, number>();
    data?.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      revenueMap.set(date, (revenueMap.get(date) || 0) + Number(order.price));
    });

    return Array.from(revenueMap.entries()).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return [];
  }
};

/**
 * Fetch orders breakdown over time
 */
export const fetchOrdersData = async (
  startDate: Date,
  endDate: Date
): Promise<OrdersDataPoint[]> => {
  try {
    const { data, error } = await supabase
      .from('product_orders')
      .select('status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group by date and status
    const ordersMap = new Map<string, { pending: number; confirmed: number; canceled: number }>();
    data?.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      const current = ordersMap.get(date) || { pending: 0, confirmed: 0, canceled: 0 };
      
      if (order.status === 'pending') current.pending++;
      else if (order.status === 'confirmed') current.confirmed++;
      else if (order.status === 'canceled') current.canceled++;
      
      ordersMap.set(date, current);
    });

    return Array.from(ordersMap.entries()).map(([date, counts]) => ({
      date,
      ...counts,
    }));
  } catch (error) {
    console.error('Error fetching orders data:', error);
    return [];
  }
};

/**
 * Fetch category distribution
 */
export const fetchCategoryDistribution = async (
  startDate?: Date,
  endDate?: Date
): Promise<CategoryDistribution[]> => {
  try {
    const query = supabase
      .from('product_orders')
      .select('product_category');

    if (startDate) query.gte('created_at', startDate.toISOString());
    if (endDate) query.lte('created_at', endDate.toISOString());

    const { data, error } = await query;
    if (error) throw error;

    // Count categories
    const categoryMap = new Map<string, number>();
    data?.forEach(order => {
      const category = order.product_category || 'unknown';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6'];
    
    return Array.from(categoryMap.entries()).map(([name, value], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: colors[index % colors.length],
    }));
  } catch (error) {
    console.error('Error fetching category distribution:', error);
    return [];
  }
};

/**
 * Fetch recent activity
 */
export const fetchRecentActivity = async (limit: number = 10): Promise<RecentActivityItem[]> => {
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('id, created_at, activity_type, description, actor_email')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map(log => ({
      id: log.id,
      timestamp: log.created_at,
      type: log.activity_type,
      description: log.description || '',
      actor: log.actor_email || 'System',
    })) || [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    return [];
  }
};

/**
 * Helper to get date boundaries
 */
const getDateBoundaries = () => {
  const now = new Date();
  
  // Today boundaries
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  // Yesterday boundaries
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayEnd);
  yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);
  
  // Last 7 days (including today)
  const last7DaysStart = new Date(todayStart);
  last7DaysStart.setDate(last7DaysStart.getDate() - 6);
  
  // Previous 7 days (the week before last 7 days)
  const prev7DaysStart = new Date(last7DaysStart);
  prev7DaysStart.setDate(prev7DaysStart.getDate() - 7);
  const prev7DaysEnd = new Date(last7DaysStart);
  prev7DaysEnd.setTime(prev7DaysEnd.getTime() - 1);
  
  // This week (Monday to Sunday)
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisWeekStart = new Date(todayStart);
  thisWeekStart.setDate(thisWeekStart.getDate() - daysFromMonday);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
  thisWeekEnd.setHours(23, 59, 59, 999);
  
  // Last week
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setTime(lastWeekEnd.getTime() - 1);
  
  return {
    todayStart,
    todayEnd,
    yesterdayStart,
    yesterdayEnd,
    last7DaysStart,
    prev7DaysStart,
    prev7DaysEnd,
    thisWeekStart,
    thisWeekEnd,
    lastWeekStart,
    lastWeekEnd,
    now,
  };
};

/**
 * Fetch sales data for a specific time period
 */
const fetchSalesForPeriod = async (
  startDate: Date,
  endDate: Date,
  periodName: string
): Promise<SalesPeriodData> => {
  try {
    const { data, error } = await supabase
      .from('product_orders')
      .select('price, status')
      .eq('status', 'confirmed')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const orders = data || [];
    const revenue = orders.reduce((sum, o) => sum + Number(o.price), 0);
    const avgOrderValue = orders.length > 0 ? revenue / orders.length : 0;

    return {
      period: periodName,
      orders: orders.length,
      revenue,
      avgOrderValue,
    };
  } catch (error) {
    console.error(`Error fetching ${periodName} sales:`, error);
    return { period: periodName, orders: 0, revenue: 0, avgOrderValue: 0 };
  }
};

/**
 * Fetch pending orders value (expected revenue)
 */
export const fetchPendingOrdersValue = async (): Promise<SalesPeriodData> => {
  try {
    const { data, error } = await supabase
      .from('product_orders')
      .select('price')
      .eq('status', 'pending');

    if (error) throw error;

    const orders = data || [];
    const revenue = orders.reduce((sum, o) => sum + Number(o.price), 0);
    const avgOrderValue = orders.length > 0 ? revenue / orders.length : 0;

    return {
      period: 'Pending',
      orders: orders.length,
      revenue,
      avgOrderValue,
    };
  } catch (error) {
    console.error('Error fetching pending orders:', error);
    return { period: 'Pending', orders: 0, revenue: 0, avgOrderValue: 0 };
  }
};

/**
 * Fetch all sales period data for dashboard
 */
export const fetchAllSalesPeriods = async () => {
  const dates = getDateBoundaries();

  const [
    todaySales,
    yesterdaySales,
    last7DaysSales,
    prev7DaysSales,
    thisWeekSales,
    lastWeekSales,
    pendingOrders,
  ] = await Promise.all([
    fetchSalesForPeriod(dates.todayStart, dates.now, 'Today'),
    fetchSalesForPeriod(dates.yesterdayStart, dates.yesterdayEnd, 'Yesterday'),
    fetchSalesForPeriod(dates.last7DaysStart, dates.now, 'Last 7 Days'),
    fetchSalesForPeriod(dates.prev7DaysStart, dates.prev7DaysEnd, 'Previous 7 Days'),
    fetchSalesForPeriod(dates.thisWeekStart, dates.now, 'This Week'),
    fetchSalesForPeriod(dates.lastWeekStart, dates.lastWeekEnd, 'Last Week'),
    fetchPendingOrdersValue(),
  ]);

  // Calculate percentage changes
  const todayVsYesterdayChange = yesterdaySales.revenue > 0
    ? ((todaySales.revenue - yesterdaySales.revenue) / yesterdaySales.revenue) * 100
    : todaySales.revenue > 0 ? 100 : 0;

  const weekVsWeekChange = lastWeekSales.revenue > 0
    ? ((thisWeekSales.revenue - lastWeekSales.revenue) / lastWeekSales.revenue) * 100
    : thisWeekSales.revenue > 0 ? 100 : 0;

  const last7VsPrev7Change = prev7DaysSales.revenue > 0
    ? ((last7DaysSales.revenue - prev7DaysSales.revenue) / prev7DaysSales.revenue) * 100
    : last7DaysSales.revenue > 0 ? 100 : 0;

  return {
    todaySales,
    yesterdaySales,
    last7DaysSales,
    thisWeekSales,
    lastWeekSales,
    pendingOrders,
    todayVsYesterdayChange,
    weekVsWeekChange,
    last7VsPrev7Change,
  };
};
