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

// Validation helper
const validateOrderInput = (orderData: OrderInput): void => {
  if (!orderData.order_number || orderData.order_number.length > 100) {
    throw new Error('Invalid order number');
  }
  if (!orderData.product_name || orderData.product_name.length > 200) {
    throw new Error('Invalid product name');
  }
  if (!orderData.package_name || orderData.package_name.length > 200) {
    throw new Error('Invalid package name');
  }
  if (orderData.quantity <= 0 || orderData.quantity > 1000) {
    throw new Error('Invalid quantity');
  }
  if (orderData.price <= 0 || orderData.price > 1000000) {
    throw new Error('Invalid price');
  }
  // Validate product_details size
  const detailsStr = JSON.stringify(orderData.product_details);
  if (detailsStr.length > 10000) {
    throw new Error('Product details too large');
  }
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
  // Validate input
  validateOrderInput(orderData);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  try {
    // Call the atomic RPC function that handles both credit deduction and order creation
    const { data: result, error: rpcError } = await supabase.rpc(
      'create_order_with_deduction' as any,
      {
        p_user_id: user.id,
        p_order_number: orderData.order_number,
        p_product_category: orderData.product_category,
        p_product_name: orderData.product_name,
        p_package_name: orderData.package_name,
        p_quantity: orderData.quantity,
        p_price: orderData.price,
        p_product_details: orderData.product_details
      }
    );

    if (rpcError) throw rpcError;

    const rpcResult = result as any;
    
    if (!rpcResult.success) {
      throw new Error(rpcResult.error || 'Failed to create order');
    }

    // Fetch the created order
    const { data: order, error: fetchError } = await supabase
      .from('product_orders')
      .select('*')
      .eq('id', rpcResult.order_id)
      .single();

    if (fetchError) throw fetchError;
    return order as Order;
  } catch (error: any) {
    console.error('Error creating order:', error);
    throw error;
  }
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
