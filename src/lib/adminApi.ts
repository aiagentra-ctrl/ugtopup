import { supabase } from "@/integrations/supabase/client";
import { Order } from "./orderApi";

export interface DashboardStats {
  total_users: number;
  new_users_last_month: number;
  total_credits_added: number;
  total_credits_spent: number;
  total_balance_remaining: number;
  pending_payment_requests: number;
  confirmed_payment_requests: number;
  rejected_payment_requests: number;
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  canceled_orders: number;
  total_revenue: number;
  last_updated: string;
}

export interface ActivityLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  activity_type: string;
  action: string;
  description: string | null;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, any>;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface OrderFilters {
  status?: 'pending' | 'confirmed' | 'canceled' | 'processing' | 'completed';
  category?: 'freefire' | 'tiktok' | 'netflix' | 'garena' | 'youtube' | 'smilecoin' | 'chatgpt' | 'unipin' | 'other';
  startDate?: string;
  endDate?: string;
}

/**
 * Fetch dashboard statistics (admin only)
 */
export const fetchDashboardStats = async (): Promise<DashboardStats | null> => {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return null;
  }
};

/**
 * Refresh dashboard statistics (admin only)
 */
export const refreshDashboardStats = async (): Promise<void> => {
  const { error } = await supabase.rpc('refresh_dashboard_stats');
  if (error) throw error;
};

/**
 * Fetch all orders with optional filters (admin only)
 */
export const fetchAllOrders = async (filters?: OrderFilters): Promise<Order[]> => {
  let query = supabase
    .from('product_orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.category) {
    query = query.eq('product_category', filters.category);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  const { data, error } = await query;
  
  if (error) throw error;
  return (data as Order[]) || [];
};

/**
 * Confirm an order and deduct credits (admin only)
 */
export const confirmOrder = async (
  orderId: string,
  remarks?: string
): Promise<{ success: boolean; message: string }> => {
  const { data, error } = await supabase.rpc('confirm_order', {
    order_id: orderId,
    admin_remarks_text: remarks || null
  });

  if (error) throw error;
  return data as { success: boolean; message: string };
};

/**
 * Cancel an order (admin only)
 */
export const cancelOrder = async (
  orderId: string,
  reason: string
): Promise<{ success: boolean; message: string }> => {
  if (!reason || reason.trim() === '') {
    throw new Error('Cancellation reason is required');
  }

  const { data, error } = await supabase.rpc('cancel_order', {
    order_id: orderId,
    cancellation_reason_text: reason
  });

  if (error) throw error;
  return data as { success: boolean; message: string };
};

/**
 * Fetch activity logs (admin only)
 */
export const fetchActivityLogs = async (limit = 100): Promise<ActivityLog[]> => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data as ActivityLog[]) || [];
};

/**
 * Check if user has admin permissions
 */
export const checkAdminAccess = async (): Promise<boolean> => {
  try {
    const { data: userRes } = await supabase.auth.getUser();
    console.log('[AdminAccess] Current user:', userRes?.user?.id, userRes?.user?.email);

    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.warn('[AdminAccess] is_admin RPC error:', error.message);
      return false;
    }

    console.log('[AdminAccess] is_admin result:', data);
    return data === true;
  } catch (e) {
    console.warn('[AdminAccess] check failed:', e);
    return false;
  }
};

/**
 * Check if user has super admin permissions
 */
export const checkSuperAdminAccess = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('is_super_admin');
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
};
