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
import { DesignPackage } from "@/data/designPackages";
import { AlertCircle } from "lucide-react";

interface DesignOrderReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderData: {
    orderId: string;
    package: DesignPackage;
    email: string;
    whatsapp: string;
    userEmail: string;
    currentBalance: number;
  };
  isSubmitting: boolean;
}

export const DesignOrderReview = ({
  isOpen,
  onClose,
  onConfirm,
  orderData,
  isSubmitting,
}: DesignOrderReviewProps) => {
  const { orderId, package: pkg, email, whatsapp, userEmail, currentBalance } = orderData;
  const hasInsufficientBalance = currentBalance < pkg.price;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-100">Review Your Order</DialogTitle>
          <DialogDescription className="text-slate-400">
            Please review the details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order ID */}
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Order ID:</span>
            <span className="text-slate-100 font-mono">{orderId}</span>
          </div>

          <Separator className="bg-slate-800" />

          {/* Package Details */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-100">Service Details</h4>
            <div className="bg-slate-800/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{pkg.icon}</span>
                <span className="font-semibold text-slate-100">{pkg.name}</span>
              </div>
              <p className="text-xs text-slate-400">{pkg.description}</p>
              <p className="text-xs text-slate-400">Delivery: {pkg.deliveryTime}</p>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Contact Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-100">Contact Information</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="text-slate-100">{email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">WhatsApp:</span>
                <span className="text-slate-100">{whatsapp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Email:</span>
                <span className="text-slate-100">{userEmail}</span>
              </div>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Service Price:</span>
              <span className="text-slate-100">{pkg.currency} {pkg.price}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span className="text-slate-100">Total Amount:</span>
              <span className="text-red-500">{pkg.currency} {pkg.price}</span>
            </div>
          </div>

          <Separator className="bg-slate-800" />

          {/* Balance Information */}
          <div className="bg-slate-800/30 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Current Balance:</span>
              <span className="text-slate-100">{pkg.currency} {currentBalance}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Balance After:</span>
              <span className={hasInsufficientBalance ? "text-red-500" : "text-green-400"}>
                {pkg.currency} {currentBalance - pkg.price}
              </span>
            </div>
          </div>

          {hasInsufficientBalance && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-red-500 font-semibold">Insufficient Credits</p>
                <p className="text-red-400 text-xs mt-1">
                  Please add credits to your account to complete this order
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="border-slate-700 hover:bg-slate-800"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={hasInsufficientBalance || isSubmitting}
            className="bg-gradient-to-r from-primary via-red-600 to-secondary hover:opacity-90"
          >
            {isSubmitting ? "Processing..." : "Confirm Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
