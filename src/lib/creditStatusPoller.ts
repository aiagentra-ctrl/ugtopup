export interface CreditStatusResponse {
  request_id: string;
  email: string;
  credits: number;
  status: boolean; // true = approved, false = rejected
  timestamp?: string;
}

export const checkCreditStatus = async (requestId: string): Promise<CreditStatusResponse | null> => {
  try {
    const response = await fetch(
      `https://n8n.aiagentra.com/webhook/payment-status?request_id=${requestId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking credit status:', error);
    return null;
  }
};
