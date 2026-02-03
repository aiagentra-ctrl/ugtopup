import { supabase } from "@/integrations/supabase/client";

export interface LianaOrder {
  id: string;
  order_id: string;
  liana_product_id: string;
  user_id: string;
  zone_id: string;
  ign: string | null;
  status: string;
  api_response: Record<string, unknown> | null;
  api_transaction_id: string | null;
  error_message: string | null;
  retry_count: number;
  created_at: string;
  updated_at: string;
  // New tracking columns
  verification_response: Record<string, unknown> | null;
  order_response: Record<string, unknown> | null;
  api_request_sent: boolean;
  verification_sent_at: string | null;
  verification_completed_at: string | null;
  order_sent_at: string | null;
  completed_at: string | null;
  // Joined from product_orders
  order_number?: string;
  product_name?: string;
  package_name?: string;
  quantity?: number;
  price?: number;
  product_details?: Record<string, unknown>;
  user_email?: string;
  user_name?: string;
  order_created_at?: string;
  order_status?: string;
  transaction_id?: string;
  failure_reason?: string;
}

export interface LianaOrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  successRate: number;
}

export async function fetchLianaOrders(statusFilter?: string): Promise<LianaOrder[]> {
  let query = supabase
    .from("liana_orders")
    .select(`
      *,
      product_orders!inner (
        order_number,
        product_name,
        package_name,
        quantity,
        price,
        product_details,
        user_email,
        user_name,
        created_at,
        status,
        transaction_id,
        failure_reason
      )
    `)
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching liana orders:", error);
    throw error;
  }

  // Flatten the joined data
  return (data || []).map((order: Record<string, unknown>) => {
    const productOrder = order.product_orders as Record<string, unknown> | null;
    return {
      ...order,
      order_number: productOrder?.order_number as string | undefined,
      product_name: productOrder?.product_name as string | undefined,
      package_name: productOrder?.package_name as string | undefined,
      quantity: productOrder?.quantity as number | undefined,
      price: productOrder?.price as number | undefined,
      product_details: productOrder?.product_details as Record<string, unknown> | undefined,
      user_email: productOrder?.user_email as string | undefined,
      user_name: productOrder?.user_name as string | undefined,
      order_created_at: productOrder?.created_at as string | undefined,
      order_status: productOrder?.status as string | undefined,
      transaction_id: productOrder?.transaction_id as string | undefined,
      failure_reason: productOrder?.failure_reason as string | undefined,
    } as LianaOrder;
  });
}

export async function getLianaOrderStats(): Promise<LianaOrderStats> {
  const { data, error } = await supabase
    .from("liana_orders")
    .select("status");

  if (error) {
    console.error("Error fetching liana order stats:", error);
    throw error;
  }

  const orders = data || [];
  const total = orders.length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const processing = orders.filter((o) => o.status === "processing").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const failed = orders.filter((o) => o.status === "failed").length;

  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, pending, processing, completed, failed, successRate };
}

export async function retryLianaOrder(orderId: string): Promise<void> {
  // Update status to pending so the edge function can retry
  const { error: updateError } = await supabase
    .from("liana_orders")
    .update({ status: "pending", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (updateError) {
    console.error("Error updating liana order for retry:", updateError);
    throw updateError;
  }

  // Get the order_id from liana_orders to call the edge function
  const { data: lianaOrder, error: fetchError } = await supabase
    .from("liana_orders")
    .select("order_id")
    .eq("id", orderId)
    .single();

  if (fetchError || !lianaOrder) {
    throw new Error("Could not find liana order");
  }

  // Call the edge function to retry processing
  const { error: fnError } = await supabase.functions.invoke("process-ml-order", {
    body: { order_id: lianaOrder.order_id },
  });

  if (fnError) {
    console.error("Error invoking process-ml-order:", fnError);
    throw fnError;
  }
}

export async function retryAllFailedOrders(): Promise<number> {
  const { data: failedOrders, error } = await supabase
    .from("liana_orders")
    .select("id")
    .eq("status", "failed");

  if (error) {
    throw error;
  }

  let retried = 0;
  for (const order of failedOrders || []) {
    try {
      await retryLianaOrder(order.id);
      retried++;
    } catch (e) {
      console.error(`Failed to retry order ${order.id}:`, e);
    }
  }

  return retried;
}
