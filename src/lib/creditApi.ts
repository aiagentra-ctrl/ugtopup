import { supabase } from "@/integrations/supabase/client";

export interface CreditRequest {
  request_id: string;
  credits: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at?: string;
  remarks?: string;
  user_name?: string;
  user_email?: string;
}

// Normalized credit history entry for display
export interface CreditHistoryEntry {
  ordernumber: string;
  credits: number;
  status: string;
}

// Normalized format for the app
export interface CreditBalance {
  email: string;
  credit: number;
}

// Submit payment request with screenshot
export const submitPaymentRequest = async (
  amount: number,
  credits: number,
  remarks: string,
  screenshot: File
): Promise<{ success: boolean; message: string; request_id?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Upload screenshot to storage
    const fileExt = screenshot.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-screenshots')
      .upload(fileName, screenshot);

    if (uploadError) throw uploadError;

    // 2. Get public URL (for admins to view)
    const { data: { publicUrl } } = supabase.storage
      .from('payment-screenshots')
      .getPublicUrl(fileName);

    // 3. Insert payment request
    const { data, error } = await supabase
      .from('payment_requests')
      .insert({
        user_id: user.id,
        amount,
        credits,
        remarks,
        screenshot_url: publicUrl,
        screenshot_path: fileName,
        user_email: user.email || '',
        user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      message: 'Payment request submitted successfully',
      request_id: data.id
    };
  } catch (error: any) {
    console.error('Submit payment request error:', error);
    return {
      success: false,
      message: error.message || 'Failed to submit payment request'
    };
  }
};

// Fetch user's payment requests
export const fetchUserPaymentRequests = async (): Promise<CreditHistoryEntry[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('payment_requests')
      .select('id, amount, credits, status, created_at, admin_remarks')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(req => ({
      ordernumber: req.id.slice(0, 8).toUpperCase(),
      credits: req.credits,
      status: req.status
    }));
  } catch (error) {
    console.error('Fetch payment requests error:', error);
    return [];
  }
};

// Fetch user's credit balance from profiles
export const fetchUserBalance = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data, error } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data?.balance || 0;
  } catch (error) {
    console.error('Fetch balance error:', error);
    return 0;
  }
};

// Ensure sufficient balance before allowing purchase
export const ensureSufficientBalance = async (required: number): Promise<{ ok: boolean; balance: number }> => {
  const balance = await fetchUserBalance();
  return { ok: balance >= required, balance };
};

// Delete payment request (admin only) with storage cleanup
export const deletePaymentRequest = async (
  requestId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // Call database function to delete record
    const { data, error } = await supabase.rpc('delete_payment_request', {
      request_id: requestId
    });

    if (error) throw error;

    const result = data as { success: boolean; message: string; screenshot_path: string | null };
    
    // Delete screenshot from storage if exists
    if (result.screenshot_path) {
      const { error: storageError } = await supabase.storage
        .from('payment-screenshots')
        .remove([result.screenshot_path]);
      
      if (storageError) {
        console.warn('Failed to delete screenshot:', storageError);
        // Don't throw error - record is already deleted
      }
    }

    return {
      success: true,
      message: 'Payment request and screenshot deleted successfully'
    };
  } catch (error: any) {
    console.error('Delete payment request error:', error);
    return {
      success: false,
      message: error.message || 'Failed to delete payment request'
    };
  }
};




