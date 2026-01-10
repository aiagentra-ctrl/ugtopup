import { supabase } from "@/integrations/supabase/client";

export interface InitiatePaymentResponse {
  success: boolean;
  redirect_url?: string;
  identifier?: string;
  error?: string;
}

export interface PaymentTransaction {
  id: string;
  identifier: string;
  amount: number;
  credits: number;
  status: string;
  payment_gateway?: string;
  created_at: string;
  completed_at?: string;
}

/**
 * Initiate an online payment via API Nepal
 */
export const initiatePayment = async (amount: number): Promise<InitiatePaymentResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const siteUrl = window.location.origin;

    const response = await supabase.functions.invoke('initiate-payment', {
      body: { amount, siteUrl }
    });

    if (response.error) {
      console.error('Initiate payment error:', response.error);
      return { 
        success: false, 
        error: response.error.message || 'Failed to initiate payment' 
      };
    }

    return response.data;
  } catch (error: any) {
    console.error('Initiate payment error:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to initiate payment' 
    };
  }
};

/**
 * Fetch a payment transaction by identifier
 */
export const getPaymentTransaction = async (identifier: string): Promise<PaymentTransaction | null> => {
  try {
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('identifier', identifier)
      .single();

    if (error) {
      console.error('Fetch transaction error:', error);
      return null;
    }

    return data as PaymentTransaction;
  } catch (error) {
    console.error('Fetch transaction error:', error);
    return null;
  }
};

/**
 * Fetch user's payment transaction history
 */
export const getPaymentHistory = async (): Promise<PaymentTransaction[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Fetch history error:', error);
      return [];
    }

    return (data || []) as PaymentTransaction[];
  } catch (error) {
    console.error('Fetch history error:', error);
    return [];
  }
};
