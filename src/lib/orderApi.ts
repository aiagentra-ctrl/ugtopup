import { supabase } from "@/integrations/supabase/client";

export interface OrderInput {
  order_number: string;
  product_category: 'freefire' | 'tiktok' | 'netflix' | 'garena' | 'youtube' | 'smilecoin' | 'chatgpt' | 'unipin' | 'other' | 'design' | 'mobile_legends' | 'roblox' | 'pubg';
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
    .insert([{
      user_id: user.id,
      user_email: user.email!,
      user_name: profile?.full_name || user.email!.split('@')[0],
      order_number: orderData.order_number,
      product_category: orderData.product_category as any,
      product_name: orderData.product_name,
      package_name: orderData.package_name,
      quantity: orderData.quantity,
      price: orderData.price,
      product_details: orderData.product_details
    }])
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
 * Format: username-3randomChars (e.g., abhiraj-a4b)
 */
export const generateOrderNumber = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Fallback if no user
      const random = Math.random().toString(36).substring(2, 5);
      return `guest-${random}`;
    }

    // Get username from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, email')
      .eq('id', user.id)
      .single();

    // Use username or fallback to email prefix
    const username = profile?.username || profile?.email?.split('@')[0] || user.email?.split('@')[0] || 'user';
    
    // Generate 3 random characters (mix of letters and numbers)
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let random = '';
    for (let i = 0; i < 3; i++) {
      random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return `${username}-${random}`;
  } catch (error) {
    console.error('Error generating order number:', error);
    const random = Math.random().toString(36).substring(2, 5);
    return `order-${random}`;
  }
};
