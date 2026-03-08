import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UnipinSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onTopUpAgain: () => void;
  voucherCode?: string | null;
}

export const UnipinSuccessModal = ({
  isOpen,
  onClose,
  orderId,
  onTopUpAgain,
  voucherCode,
}: UnipinSuccessModalProps) => {
  const navigate = useNavigate();

  const handleViewOrders = () => {
    onClose();
    navigate("/dashboard");
  };

  const handleCopyCode = () => {
    if (voucherCode) {
      navigator.clipboard.writeText(voucherCode);
      toast.success("Voucher code copied!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-dashboard-green/20 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-dashboard-green" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Order Placed Successfully! 🎉
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {voucherCode
              ? "Your voucher code has been delivered instantly!"
              : "Your Unipin UC order has been confirmed and is being processed."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="text-base font-bold text-primary">{orderId}</span>
            </div>
          </div>

          {voucherCode ? (
            <div className="p-4 rounded-lg bg-dashboard-green/10 border border-dashboard-green/30 space-y-2">
              <p className="text-sm text-center text-muted-foreground">Your Voucher Code</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-xl font-bold font-mono text-foreground tracking-widest">
                  {voucherCode}
                </code>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-dashboard-green/10 border border-dashboard-green/30">
              <p className="text-sm text-center text-muted-foreground">
                Your UC Points will be delivered to your email shortly. Please check your inbox.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleViewOrders}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 font-semibold"
          >
            View My Orders
          </Button>
          <Button
            onClick={onTopUpAgain}
            variant="outline"
            className="w-full"
          >
            Top Up Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
