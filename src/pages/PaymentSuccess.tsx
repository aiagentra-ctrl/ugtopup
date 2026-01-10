import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, Loader2, ArrowRight, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPaymentTransaction, PaymentTransaction } from "@/lib/paymentApi";
import { useLiveBalance } from "@/hooks/useLiveBalance";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const identifier = searchParams.get("id");
  const { balance, fetchNow } = useLiveBalance();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!identifier) {
        setLoading(false);
        return;
      }

      // Poll for transaction status (IPN might take a moment)
      let attempts = 0;
      const maxAttempts = 10;

      const pollTransaction = async () => {
        const txn = await getPaymentTransaction(identifier);
        
        if (txn) {
          setTransaction(txn);
          
          if (txn.status === 'completed') {
            setLoading(false);
            fetchNow(); // Refresh balance
            return;
          }
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(pollTransaction, 2000); // Poll every 2 seconds
        } else {
          setLoading(false);
        }
      };

      await pollTransaction();
    };

    fetchTransaction();
  }, [identifier, fetchNow]);

  const isCompleted = transaction?.status === 'completed';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          {loading ? (
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
          ) : isCompleted ? (
            <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
          ) : (
            <Loader2 className="w-16 h-16 mx-auto text-yellow-500" />
          )}
          <CardTitle className="text-2xl mt-4">
            {loading 
              ? "Processing Payment..." 
              : isCompleted 
                ? "Payment Successful!" 
                : "Payment Processing"
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {loading ? (
            <p className="text-muted-foreground">
              Please wait while we confirm your payment...
            </p>
          ) : isCompleted && transaction ? (
            <>
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-muted-foreground">Amount Paid</p>
                <p className="text-2xl font-bold text-primary">
                  Rs. {transaction.amount}
                </p>
              </div>

              <div className="bg-green-500/10 rounded-lg p-4 space-y-2">
                <p className="text-muted-foreground">Credits Added</p>
                <p className="text-2xl font-bold text-green-500">
                  +{transaction.credits} Credits
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Wallet className="w-4 h-4" />
                <span>New Balance: <strong className="text-foreground">{balance} Credits</strong></span>
              </div>

              <p className="text-xs text-muted-foreground">
                Transaction ID: {transaction.identifier}
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Your payment is being processed. Credits will be added shortly.
              </p>
              <p className="text-xs text-muted-foreground">
                Transaction ID: {identifier || 'N/A'}
              </p>
            </>
          )}

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
