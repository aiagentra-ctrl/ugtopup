import { supabase } from "@/integrations/supabase/client";

export interface CouponValidation {
  valid: boolean;
  message: string;
  discount_type?: string;
  discount_value?: number;
  discount_amount?: number;
  final_price?: number;
}

export const validateCoupon = async (
  code: string,
  orderAmount: number,
  productCategory?: string
): Promise<CouponValidation> => {
  const { data, error } = await supabase.rpc("validate_coupon", {
    p_coupon_code: code.trim().toUpperCase(),
    p_order_amount: orderAmount,
    p_product_category: productCategory || null,
  });

  if (error) {
    return { valid: false, message: error.message };
  }

  return data as CouponValidation;
};

export const getAvailableCoupons = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_used", false)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  return data || [];
};
