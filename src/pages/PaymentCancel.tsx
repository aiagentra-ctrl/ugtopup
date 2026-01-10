import { useNavigate, useSearchParams } from "react-router-dom";
import { XCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PaymentCancel = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const identifier = searchParams.get("id");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-2">
          <XCircle className="w-16 h-16 mx-auto text-destructive" />
          <CardTitle className="text-2xl mt-4">
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-muted-foreground">
            Your payment was cancelled. No credits have been deducted from your account.
          </p>

          {identifier && (
            <p className="text-xs text-muted-foreground">
              Reference: {identifier}
            </p>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              If you experienced any issues, please try again or use the manual payment option.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;
