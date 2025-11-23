import { supabase } from "@/integrations/supabase/client";

export interface SupabaseLimits {
  storage: {
    used_mb: number;
    limit_mb: number;
    percentage: number;
  };
  database: {
    used_mb: number;
    limit_mb: number;
    percentage: number;
  };
  payment_screenshots_bucket: {
    used_mb: number;
    limit_mb: number;
    percentage: number;
    file_count: number;
  };
  last_updated: string;
}

export const fetchSupabaseLimits = async (): Promise<SupabaseLimits | null> => {
  try {
    // Call database function to get storage usage
    const { data: storageData, error: storageError } = await supabase
      .rpc('get_storage_usage');

    if (storageError) {
      console.error('Storage query error:', storageError);
      throw storageError;
    }

    const storage = storageData as { total_bytes: number; file_count: number };
    const totalMB = storage.total_bytes / (1024 * 1024);
    const fileCount = storage.file_count;

    // Get database size (approximate from table rows)
    const { count: paymentCount } = await supabase
      .from('payment_requests')
      .select('*', { count: 'exact', head: true });

    const { count: orderCount } = await supabase
      .from('product_orders')
      .select('*', { count: 'exact', head: true });

    const { count: profileCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Rough estimate: Each row ~1-5KB depending on jsonb fields
    const estimatedDbMB = ((paymentCount || 0) * 3 + (orderCount || 0) * 3 + (profileCount || 0) * 1) / 1024;

    // Free plan limits
    const STORAGE_LIMIT_MB = 5 * 1024; // 5GB
    const BUCKET_LIMIT_MB = 1 * 1024; // 1GB
    const DB_LIMIT_MB = 500; // 500MB

    return {
      storage: {
        used_mb: totalMB,
        limit_mb: STORAGE_LIMIT_MB,
        percentage: (totalMB / STORAGE_LIMIT_MB) * 100
      },
      database: {
        used_mb: estimatedDbMB,
        limit_mb: DB_LIMIT_MB,
        percentage: (estimatedDbMB / DB_LIMIT_MB) * 100
      },
      payment_screenshots_bucket: {
        used_mb: totalMB,
        limit_mb: BUCKET_LIMIT_MB,
        percentage: (totalMB / BUCKET_LIMIT_MB) * 100,
        file_count: fileCount
      },
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching Supabase limits:', error);
    return null;
  }
};
