import { useEffect, useRef, useState } from 'react';
import { getCreditRequests, updateCreditRequestStatus } from '@/lib/creditRequestStorage';
import { checkCreditStatus } from '@/lib/creditStatusPoller';
import { addCreditsToBalance } from '@/lib/balanceStorage';
import { toast } from 'sonner';

export const useCreditPoller = (enabled: boolean = true) => {
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const processedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled) return;

    const pollPendingRequests = async () => {
      try {
        setIsPolling(true);
        const requests = getCreditRequests();
        
        // Get only pending requests
        const pendingRequests = requests.filter(
          req => req.status === 'pending' && !processedIdsRef.current.has(req.id)
        );

        if (pendingRequests.length === 0) {
          setIsPolling(false);
          return;
        }

        // Check status for each pending request
        for (const request of pendingRequests) {
          const statusResponse = await checkCreditStatus(request.id);
          
          if (statusResponse) {
            // Mark as processed to avoid duplicate processing
            processedIdsRef.current.add(request.id);
            
            if (statusResponse.status === true) {
              // APPROVED
              const updated = updateCreditRequestStatus(request.id, 'approved');
              
              if (updated) {
                // Add credits to balance
                const newBalance = addCreditsToBalance(request.credits);
                
                toast.success(
                  `🎉 Payment Approved! ${request.credits} credits added to your account.`,
                  { duration: 5000 }
                );
                
                console.log(`Credits added: ${request.credits}, New balance: ${newBalance}`);
              }
            } else {
              // REJECTED
              updateCreditRequestStatus(request.id, 'rejected');
              
              toast.error(
                `❌ Payment Rejected for ${request.credits} credits request.`,
                { duration: 5000 }
              );
            }
            
            // Trigger UI refresh by dispatching custom event
            window.dispatchEvent(new CustomEvent('creditStatusUpdated'));
          }
        }
        
        setIsPolling(false);
      } catch (error) {
        console.error('Polling error:', error);
        setIsPolling(false);
      }
    };

    // Poll every 10 seconds
    intervalRef.current = setInterval(pollPendingRequests, 10000);
    
    // Poll immediately on mount
    pollPendingRequests();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled]);

  return { isPolling };
};
