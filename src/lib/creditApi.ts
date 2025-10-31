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

export interface UserCreditData {
  email: string;
  balance: number;
  requests: CreditRequest[];
}

const WEBHOOK_URL = 'https://n8n.aiagentra.com/webhook/payment-pending';

/**
 * Fetch user's credit balance and request history from n8n
 */
export const fetchUserCredits = async (email: string): Promise<UserCreditData> => {
  try {
    const response = await fetch(`${WEBHOOK_URL}?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch credit data: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user credits:', error);
    throw error;
  }
};

/**
 * Submit a new credit top-up request to n8n
 */
export const submitCreditRequest = async (formData: FormData): Promise<any> => {
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error:', response.status, errorText);
      throw new Error('Failed to submit request to webhook');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error submitting credit request:', error);
    throw error;
  }
};
