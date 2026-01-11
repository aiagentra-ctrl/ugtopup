import { supabase } from "@/integrations/supabase/client";

export interface PaymentError {
  code: string;
  title: string;
  description: string;
  suggestion: 'manual' | 'retry' | 'support';
}

export interface InitiatePaymentResponse {
  success: boolean;
  redirect_url?: string;
  identifier?: string;
  error?: string;
  paymentError?: PaymentError;
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
 * Map API Nepal errors to user-friendly messages
 */
const getPaymentError = (error: string): PaymentError => {
  const errorLower = error.toLowerCase();
  
  // Known API Nepal errors
  if (errorLower.includes('insufficient balance')) {
    return {
      code: 'GATEWAY_BALANCE',
      title: 'Payment Service Temporarily Unavailable',
      description: 'Our payment gateway is experiencing issues. Please try Manual Payment or contact support.',
      suggestion: 'manual'
    };
  }
  
  if (errorLower.includes('invalid api key') || errorLower.includes('invalid key')) {
    return {
      code: 'CONFIG_ERROR',
      title: 'Payment Configuration Error',
      description: 'There is a configuration issue with our payment system. Please use Manual Payment.',
      suggestion: 'manual'
    };
  }
  
  if (errorLower.includes('network') || errorLower.includes('timeout') || errorLower.includes('connection')) {
    return {
      code: 'NETWORK_ERROR',
      title: 'Connection Problem',
      description: 'Unable to connect to payment gateway. Please check your internet and try again.',
      suggestion: 'retry'
    };
  }
  
  if (errorLower.includes('maintenance') || errorLower.includes('unavailable')) {
    return {
      code: 'MAINTENANCE',
      title: 'Payment Gateway Maintenance',
      description: 'The payment gateway is under maintenance. Please try Manual Payment or try again later.',
      suggestion: 'manual'
    };
  }
  
  if (errorLower.includes('limit') || errorLower.includes('exceeded')) {
    return {
      code: 'LIMIT_EXCEEDED',
      title: 'Transaction Limit Reached',
      description: 'Transaction limit exceeded. Please try a smaller amount or use Manual Payment.',
      suggestion: 'manual'
    };
  }

  // Generic error
  return {
    code: 'UNKNOWN',
    title: 'Payment Failed',
    description: error || 'An unknown error occurred. Please try again or use Manual Payment.',
    suggestion: 'retry'
  };
};

/**
 * Initiate an online payment via API Nepal
 */
export const initiatePayment = async (amount: number): Promise<InitiatePaymentResponse> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { 
        success: false, 
        error: 'Not authenticated',
        paymentError: {
          code: 'AUTH_ERROR',
          title: 'Login Required',
          description: 'Please log in to make a payment.',
          suggestion: 'retry'
        }
      };
    }

    const siteUrl = window.location.origin;

    const response = await supabase.functions.invoke('initiate-payment', {
      body: { amount, siteUrl }
    });

    if (response.error) {
      console.error('Initiate payment error:', response.error);
      const errorMessage = response.error.message || 'Failed to initiate payment';
      return { 
        success: false, 
        error: errorMessage,
        paymentError: getPaymentError(errorMessage)
      };
    }

    // Handle error response from edge function
    if (response.data?.error) {
      const errorMessage = response.data.error;
      return {
        success: false,
        error: errorMessage,
        paymentError: getPaymentError(errorMessage)
      };
    }

    return response.data;
  } catch (error: any) {
    console.error('Initiate payment error:', error);
    const errorMessage = error.message || 'Failed to initiate payment';
    return { 
      success: false, 
      error: errorMessage,
      paymentError: getPaymentError(errorMessage)
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
