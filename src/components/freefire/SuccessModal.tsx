import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onTopUpAgain: () => void;
}

export const SuccessModal = ({ isOpen, onClose, orderId, onTopUpAgain }: SuccessModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-dashboard-green-bright/20 max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 rounded-full bg-dashboard-green/20 flex items-center justify-center dashboard-glow-green">
              <CheckCircle2 className="w-10 h-10 text-dashboard-green-bright" />
            </div>
            <DialogTitle className="text-2xl font-bold text-center text-foreground">
              Order Placed Successfully!
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Your Free Fire diamonds will be credited shortly
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border text-center">
            <p className="text-sm text-muted-foreground mb-1">Order Reference</p>
            <p className="text-lg font-mono font-semibold text-primary">{orderId}</p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              View My Orders
            </Button>
            <Button
              onClick={() => {
                onClose();
                onTopUpAgain();
              }}
              variant="outline"
              className="w-full"
            >
              Top Up Again
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            💡 Tip: You can track your order status in the Dashboard
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
