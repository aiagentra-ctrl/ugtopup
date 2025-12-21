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
import { type RobloxPackage } from "@/data/robloxPackages";
import { AlertCircle, Shield } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RobloxOrderReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  orderData: {
    orderId: string;
    package: RobloxPackage;
    username: string;
    password: string;
    whatsapp?: string;
    email: string;
    currentBalance: number;
  };
  isSubmitting: boolean;
  purchaseQuantity?: number;
  totalPrice?: number;
  totalItems?: number;
}

export const RobloxOrderReview = ({
  isOpen,
  onClose,
  onConfirm,
  orderData,
  isSubmitting,
  purchaseQuantity = 1,
  totalPrice: propTotalPrice,
  totalItems: propTotalItems,
}: RobloxOrderReviewProps) => {
  const { orderId, package: pkg, username, whatsapp, email, currentBalance } = orderData;
  const totalPrice = propTotalPrice ?? pkg.price * purchaseQuantity;
  const totalItems = propTotalItems ?? pkg.quantity * purchaseQuantity;
  const insufficientBalance = currentBalance < totalPrice;
  const balanceAfter = currentBalance - totalPrice;

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
          <Alert className="bg-blue-500/10 border-blue-500/30">
            <Shield className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-sm text-blue-400">
              Your credentials are securely encrypted and will only be used to process your Robux order.
            </AlertDescription>
          </Alert>

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
            {purchaseQuantity > 1 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="text-slate-100">{purchaseQuantity} × {pkg.quantity.toLocaleString()} Robux</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Unit Price:</span>
                  <span className="text-slate-100">{pkg.currency} {pkg.price.toLocaleString()} each</span>
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Items:</span>
                  <span className="font-semibold text-green-400">{totalItems.toLocaleString()} Robux</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-slate-400">Total Price:</span>
              <span className="font-bold text-green-400">{pkg.currency} {totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Username:</span>
              <span className="text-slate-100">{username}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Password:</span>
              <span className="text-slate-100 font-mono">••••••••</span>
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
              <span className="text-slate-100">₹{currentBalance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-slate-400">Balance After:</span>
              <span className={insufficientBalance ? "text-red-400" : "text-green-400"}>
                ₹{balanceAfter.toLocaleString()}
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
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="bg-slate-800 border-slate-700 text-slate-100 hover:bg-slate-700">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isSubmitting || insufficientBalance}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            {isSubmitting ? "Processing..." : "Confirm Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
