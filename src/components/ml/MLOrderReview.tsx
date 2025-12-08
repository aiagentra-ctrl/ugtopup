import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { type MLPackage } from "@/components/ml/MLPackageSelector";
import { AlertCircle } from "lucide-react";
import { useLiveBalance } from "@/hooks/useLiveBalance";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface MLOrderReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderData: {
    orderId: string;
    package: MLPackage;
    userId: string;
    zoneId: string;
    whatsapp?: string;
    email: string;
  };
  isPlacingOrder?: boolean;
}

export const MLOrderReview = ({
  isOpen,
  onClose,
  onConfirm,
  orderData,
  isPlacingOrder = false,
}: MLOrderReviewProps) => {
  const { user } = useAuth();
  const { balance, fetchNow } = useLiveBalance();
  const { orderId, package: pkg, userId, zoneId, whatsapp, email } = orderData;

  useEffect(() => {
    if (isOpen) {
      fetchNow();
    }
  }, [isOpen]);

  const currentBalance = balance;
  const totalPrice = pkg.price;
  const balanceAfter = currentBalance - totalPrice;
  const insufficientBalance = balanceAfter < 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>Review Your Order</DialogTitle>
          <DialogDescription className="text-slate-400">
            Please verify your order details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Order ID:</span>
              <span className="font-mono text-slate-100">{orderId}</span>
            </div>
            <Separator className="bg-slate-800" />
          </div>

          <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Package:</span>
              <span className="font-semibold text-slate-100">{pkg.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Price:</span>
              <span className="font-bold text-blue-400">{pkg.currency} {pkg.price}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">User ID:</span>
              <span className="text-slate-100">{userId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Zone ID:</span>
              <span className="text-slate-100">{zoneId}</span>
            </div>
            {whatsapp && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">WhatsApp:</span>
                <span className="text-slate-100">{whatsapp}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Email:</span>
              <span className="text-slate-100">{email}</span>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Current Balance:</span>
              <span className="text-slate-100">{currentBalance} 💵</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-slate-400">Balance After:</span>
              <span className={insufficientBalance ? "text-red-400" : "text-green-400"}>
                {balanceAfter} 💵
              </span>
            </div>
          </div>

          {insufficientBalance && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-400">
                Insufficient balance. Please add credits to your account to complete this purchase.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPlacingOrder} className="bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPlacingOrder || insufficientBalance}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            {isPlacingOrder ? "Processing..." : "Confirm Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
