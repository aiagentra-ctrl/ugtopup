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

interface TikTokSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onTopUpAgain: () => void;
}

export const TikTokSuccessModal = ({ isOpen, onClose, orderId, onTopUpAgain }: TikTokSuccessModalProps) => {
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
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#FE2C55] to-[#25F4EE] flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl">Order Placed Successfully! 🎉</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Your TikTok Coins order has been confirmed and is being processed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          <div className="bg-card/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="font-bold text-[#FE2C55]">{orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="font-semibold text-green-500">Processing</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Your coins will be delivered to your TikTok account shortly. Check your dashboard for order updates.
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
            onClick={onTopUpAgain}
            className="w-full bg-gradient-to-r from-[#FE2C55] to-[#25F4EE] hover:opacity-90 text-white"
          >
            Top Up Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
