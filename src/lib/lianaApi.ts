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
  // Joined wallet log
  wallet_log?: {
    coins_used: number;
    balance_before: number | null;
    balance_after: number | null;
    api_status: string | null;
  } | null;
}

export interface LianaOrderStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  canceled: number;
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
  if (error) throw error;

  // Fetch wallet logs for these orders
  const orderIds = (data || []).map((o: any) => o.order_id).filter(Boolean);
  let walletMap: Record<string, any> = {};
  if (orderIds.length > 0) {
    const { data: logs } = await supabase
      .from("wallet_activity_logs")
      .select("order_id, coins_used, balance_before, balance_after, api_status")
      .in("order_id", orderIds);
    if (logs) {
      for (const log of logs) {
        if (log.order_id) walletMap[log.order_id] = log;
      }
    }
  }

  return (data || []).map((order: Record<string, unknown>) => {
    const productOrder = order.product_orders as Record<string, unknown> | null;
    const orderId = order.order_id as string;
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
      wallet_log: walletMap[orderId] || null,
    } as LianaOrder;
  });
}

export async function getLianaOrderStats(): Promise<LianaOrderStats> {
  const { data, error } = await supabase
    .from("liana_orders")
    .select("status");
  if (error) throw error;

  const orders = data || [];
  const total = orders.length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const processing = orders.filter((o) => o.status === "processing").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const failed = orders.filter((o) => o.status === "failed").length;
  const canceled = orders.filter((o) => o.status === "canceled").length;
  const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, pending, processing, completed, failed, canceled, successRate };
}

export async function cancelLianaOrder(orderId: string): Promise<void> {
  const { error: updateError } = await supabase
    .from("liana_orders")
    .update({ status: "canceled", error_message: "Manually canceled by admin", updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (updateError) throw updateError;

  const { data: lianaOrder, error: fetchError } = await supabase
    .from("liana_orders")
    .select("order_id")
    .eq("id", orderId)
    .single();
  if (fetchError || !lianaOrder) throw new Error("Could not find liana order");

  const { error: productError } = await supabase
    .from("product_orders")
    .update({ status: "canceled", failure_reason: "Manually canceled by admin", canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", lianaOrder.order_id);
  if (productError) throw productError;
}

export async function retryLianaOrder(orderId: string): Promise<void> {
  const { error: updateError } = await supabase
    .from("liana_orders")
    .update({ status: "pending", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (updateError) throw updateError;

  const { data: lianaOrder, error: fetchError } = await supabase
    .from("liana_orders")
    .select("order_id")
    .eq("id", orderId)
    .single();
  if (fetchError || !lianaOrder) throw new Error("Could not find liana order");

  const { error: fnError } = await supabase.functions.invoke("process-ml-order", {
    body: { order_id: lianaOrder.order_id },
  });
  if (fnError) throw fnError;
}

export async function getApiErrorAlerts(): Promise<Array<{ type: string; message: string; count: number; latest: string }>> {
  const { data } = await supabase
    .from("wallet_activity_logs")
    .select("api_status, error_message, created_at")
    .not("error_message", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (!data || data.length === 0) return [];

  // Group by error type
  const groups: Record<string, { count: number; message: string; latest: string }> = {};
  for (const log of data) {
    const key = log.api_status || "unknown";
    if (!groups[key]) {
      groups[key] = { count: 0, message: log.error_message || "", latest: log.created_at };
    }
    groups[key].count++;
  }

  return Object.entries(groups).map(([type, info]) => ({
    type,
    message: info.message,
    count: info.count,
    latest: info.latest,
  }));
}
