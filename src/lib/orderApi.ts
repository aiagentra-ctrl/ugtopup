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
 * Create a new order with atomic credit deduction
 */
export const createOrder = async (orderData: OrderInput): Promise<Order> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Call the database function to atomically create order and deduct credits
  const { data: result, error } = await supabase.rpc('create_order_with_deduction', {
    p_user_id: user.id,
    p_order_number: orderData.order_number,
    p_product_category: orderData.product_category,
    p_product_name: orderData.product_name,
    p_package_name: orderData.package_name,
    p_quantity: orderData.quantity,
    p_price: orderData.price,
    p_product_details: orderData.product_details
  });

  if (error) throw error;

  // Check if the function returned an error
  if (!result.success) {
    throw new Error(result.error);
  }

  // Fetch the created order
  const { data: order, error: fetchError } = await supabase
    .from('product_orders')
    .select('*')
    .eq('id', result.order_id)
    .single();

  if (fetchError) throw fetchError;
  return order as Order;
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
 * Generate a unique order number with collision detection
 * Format: username-6randomChars (e.g., abhiraj-a4b7x9)
 */
export const generateOrderNumber = async (maxRetries = 5): Promise<string> => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Fallback if no user - use 6 random chars
        const random = Math.random().toString(36).substring(2, 8);
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
      
      // Generate 6 random characters for more uniqueness (36^6 = 2.1 billion combinations)
      let random = '';
      for (let i = 0; i < 6; i++) {
        random += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const orderNumber = `${username}-${random}`;
      
      // Check if order number already exists
      const { data: existing, error } = await supabase
        .from('product_orders')
        .select('order_number')
        .eq('order_number', orderNumber)
        .maybeSingle();
      
      if (error) throw error;
      
      // If doesn't exist, return it
      if (!existing) {
        return orderNumber;
      }
      
      // If exists, retry with different random chars
      console.log(`Order number collision detected: ${orderNumber}, retrying (attempt ${attempt + 1})...`);
    } catch (error) {
      console.error('Error generating order number:', error);
    }
  }
  
  // Fallback with timestamp to ensure absolute uniqueness
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  return `order-${timestamp}-${random}`;
};
