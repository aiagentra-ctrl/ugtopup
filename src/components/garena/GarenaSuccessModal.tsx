import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface GarenaSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onTopUpAgain: () => void;
  voucherCode?: string | null;
}

export const GarenaSuccessModal = ({
  isOpen,
  onClose,
  orderId,
  onTopUpAgain,
  voucherCode,
}: GarenaSuccessModalProps) => {
  const navigate = useNavigate();

  const handleViewOrders = () => {
    onClose();
    navigate("/dashboard");
  };

  const handleTopUpAgain = () => {
    onTopUpAgain();
    onClose();
  };

  const handleCopyCode = () => {
    if (voucherCode) {
      navigator.clipboard.writeText(voucherCode);
      toast.success("Voucher code copied!");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-primary/30 shadow-[0_0_50px_rgba(255,0,0,0.3)]">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-foreground">
            Order Successful!
          </DialogTitle>
          <DialogDescription className="text-center space-y-2 pt-4">
            <p className="text-base text-muted-foreground">
              {voucherCode
                ? "Your voucher code has been delivered instantly!"
                : "Your order has been placed successfully"}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <span className="text-sm text-muted-foreground">Order ID:</span>
              <span className="text-base font-bold text-primary bg-primary/15 px-3 py-1 rounded">
                {orderId}
              </span>
            </div>

            {voucherCode ? (
              <div className="mt-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30 space-y-2">
                <p className="text-sm text-muted-foreground">Your Voucher Code</p>
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
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="text-sm font-semibold text-green-500 bg-green-500/10 px-3 py-1 rounded">
                  Processing
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleViewOrders}
            className="w-full sm:w-auto border-border/50 hover:border-primary/50 hover:bg-primary/5"
          >
            View My Orders
          </Button>
          <Button
            onClick={handleTopUpAgain}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-[0_0_20px_rgba(255,0,0,0.4)]"
          >
            Top-Up Again
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
