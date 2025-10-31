export interface LocalCreditRequest {
  id: string;
  user_id: string;
  amount: number;
  credits: number;
  status: 'pending' | 'approved' | 'rejected';
  screenshot_url: string;
  created_at: string;
  remarks?: string;
  user_name: string;
  user_email: string;
  processed_at?: string;
}

const STORAGE_KEY = 'credit_requests';

export const saveCreditRequest = (request: LocalCreditRequest): void => {
  const existing = getCreditRequests();
  existing.unshift(request);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const getCreditRequests = (): LocalCreditRequest[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading credit requests from localStorage:', error);
    return [];
  }
};

export const clearOldRequests = (daysOld: number = 30): void => {
  const requests = getCreditRequests();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const filtered = requests.filter(req => 
    new Date(req.created_at) > cutoffDate
  );
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const updateCreditRequestStatus = (
  requestId: string, 
  status: 'approved' | 'rejected',
  processedAt?: string
): boolean => {
  try {
    const requests = getCreditRequests();
    const index = requests.findIndex(req => req.id === requestId);
    
    if (index === -1) {
      return false;
    }

    requests[index].status = status;
    requests[index].processed_at = processedAt || new Date().toISOString();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    return true;
  } catch (error) {
    console.error('Error updating credit request status:', error);
    return false;
  }
};
