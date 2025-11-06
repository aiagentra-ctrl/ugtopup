import { supabase } from "@/integrations/supabase/client";

export interface OrderInput {
  order_number: string;
  product_category: 'freefire' | 'tiktok' | 'netflix' | 'garena' | 'youtube' | 'smilecoin' | 'chatgpt' | 'unipin' | 'other';
  product_name: string;
  package_name: string;
  quantity: number;
  price: number;
  product_details: Record<string, any>;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  user_email: string;
  user_name: string | null;
  product_category: string;
  product_name: string;
  package_name: string;
  quantity: number;
  price: number;
  product_details: Record<string, any>;
  status: 'pending' | 'confirmed' | 'canceled' | 'processing' | 'completed';
  payment_method: string;
  credits_deducted: number;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
  canceled_at: string | null;
  reviewed_by: string | null;
  admin_remarks: string | null;
  cancellation_reason: string | null;
  metadata: Record<string, any>;
}

/**
 * Create a new order
 */
export const createOrder = async (orderData: OrderInput): Promise<Order> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, balance')
    .eq('id', user.id)
    .single();

  // Check balance
  if (!profile || profile.balance < orderData.price) {
    throw new Error('Insufficient credits. Please top up your account.');
  }

  const { data, error } = await supabase
    .from('product_orders')
    .insert({
      user_id: user.id,
      user_email: user.email!,
      user_name: profile?.full_name || user.email!.split('@')[0],
      ...orderData
    })
    .select()
    .single();

  if (error) throw error;
  return data as Order;
};

/**
 * Fetch orders for the current user
 */
export const fetchUserOrders = async (): Promise<Order[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('product_orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Order[]) || [];
};

/**
 * Fetch a single order by ID
 */
export const fetchOrderById = async (orderId: string): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('product_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order:', error);
    return null;
  }
  return data as Order;
};

/**
 * Generate a unique order number
 */
export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};
