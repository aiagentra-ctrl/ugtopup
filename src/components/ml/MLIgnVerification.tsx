import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, UserCheck } from "lucide-react";

interface MLIgnVerificationProps {
  ign: string;
  userId: string;
  zoneId: string;
  isLoading: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onRetry: () => void;
}

export const MLIgnVerification = ({
  ign,
  userId,
  zoneId,
  isLoading,
  error,
  onConfirm,
  onCancel,
  onRetry,
}: MLIgnVerificationProps) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-[90%] max-w-sm bg-card border-border">
          <CardContent className="pt-6 text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-lg font-semibold text-foreground">Verifying Account...</p>
            <p className="text-sm text-muted-foreground">
              Checking Game ID: {userId} (Zone: {zoneId})
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-[90%] max-w-sm bg-card border-destructive/50">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <p className="text-lg font-semibold text-foreground">Verification Failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
              <Button onClick={onRetry} className="flex-1">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-[90%] max-w-sm bg-card border-primary/30">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <UserCheck className="h-10 w-10 text-primary" />
          </div>
          <p className="text-lg font-semibold text-foreground">Is this your account?</p>
          
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">IGN:</span>
              <span className="font-bold text-foreground text-base">{ign}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Game ID:</span>
              <span className="text-foreground">{userId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Zone ID:</span>
              <span className="text-foreground">{zoneId}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Please confirm this is the correct account before proceeding.
          </p>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={onConfirm} className="flex-1 bg-primary hover:bg-primary/90">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Yes, Confirm
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
