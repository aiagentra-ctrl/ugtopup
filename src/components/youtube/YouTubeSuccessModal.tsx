import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface YouTubeSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onSubscribeAgain: () => void;
}

export const YouTubeSuccessModal = ({ isOpen, onClose, orderId, onSubscribeAgain }: YouTubeSuccessModalProps) => {
  const navigate = useNavigate();

  const handleViewOrders = () => {
    onClose();
    navigate("/dashboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass-card border-border/50">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-primary via-red-600 to-secondary flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl">Subscription Successful! 🎉</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Your YouTube Premium subscription has been confirmed and is being processed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <div className="bg-card/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="font-bold text-primary">{orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="font-semibold text-green-500">Processing</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Your subscription will be activated shortly. Check your dashboard for order updates.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleViewOrders}
            variant="outline"
            className="w-full"
          >
            View My Orders
          </Button>
          <Button
            onClick={onSubscribeAgain}
            className="w-full bg-gradient-to-r from-primary via-red-600 to-secondary hover:opacity-90 text-white"
          >
            Subscribe Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
