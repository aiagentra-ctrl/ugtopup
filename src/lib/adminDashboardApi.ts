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
