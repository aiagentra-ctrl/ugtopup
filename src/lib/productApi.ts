import { supabase } from "@/integrations/supabase/client";

export interface Product {
  id: string;
  product_id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  original_price?: number;
  quantity?: number;
  stock_status: 'in_stock' | 'out_of_stock' | 'coming_soon';
  image_url?: string;
  is_active: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ProductFilters {
  category?: string;
  stock_status?: string;
  is_active?: boolean;
  search?: string;
}

export const fetchAllProducts = async (filters?: ProductFilters): Promise<Product[]> => {
  let query = supabase
    .from('products' as any)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.stock_status) query = query.eq('stock_status', filters.stock_status);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,product_id.ilike.%${filters.search}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as Product[]) || [];
};

export const fetchProductById = async (id: string): Promise<Product | null> => {
  const { data, error } = await supabase
    .from('products' as any)
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as unknown as Product;
};

export const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('products' as any)
    .insert([{ ...product, created_by: user?.id }])
    .select()
    .single();
  
  if (error) throw error;
  return data as unknown as Product;
};

export const updateProduct = async (id: string, updates: Partial<Product>): Promise<Product> => {
  const { data, error } = await supabase
    .from('products' as any)
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as unknown as Product;
};

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('products' as any)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export interface ProductAnalytics {
  totalProducts: number;
  outOfStock: number;
  averagePrice: number;
  topSelling: string;
}

export const getProductAnalytics = async (): Promise<ProductAnalytics> => {
  const { data: products } = await supabase.from('products' as any).select('*');
  const { data: orders } = await supabase
    .from('product_orders')
    .select('product_name, quantity, price')
    .eq('status', 'confirmed');
  
  const productList = (products as unknown as Product[]) || [];
  const totalProducts = productList.length;
  const outOfStock = productList.filter(p => p.stock_status === 'out_of_stock').length;
  const averagePrice = totalProducts > 0 
    ? productList.reduce((sum, p) => sum + Number(p.price), 0) / totalProducts 
    : 0;
  
  // Calculate top selling product
  const productCounts: Record<string, number> = {};
  orders?.forEach(order => {
    productCounts[order.product_name] = (productCounts[order.product_name] || 0) + order.quantity;
  });
  
  const topProduct = Object.entries(productCounts).sort(([, a], [, b]) => b - a)[0];
  const topSelling = topProduct ? topProduct[0] : 'N/A';
  
  return { totalProducts, outOfStock, averagePrice, topSelling };
};
