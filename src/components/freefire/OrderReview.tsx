import { Package } from "@/data/freefirePackages";
import { UserFormData } from "./UserInputForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLiveBalance } from "@/hooks/useLiveBalance";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface OrderReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedPackage: Package | null;
  formData: UserFormData | null;
  orderId: string;
  isPlacingOrder?: boolean;
  purchaseQuantity?: number;
  totalPrice?: number;
  totalItems?: number;
}

export const OrderReview = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPackage,
  formData,
  orderId,
  isPlacingOrder = false,
  purchaseQuantity = 1,
  totalPrice: propTotalPrice,
  totalItems: propTotalItems,
}: OrderReviewProps) => {
  const { user } = useAuth();
  const { balance, fetchNow } = useLiveBalance();

  // Fetch fresh balance when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchNow();
    }
  }, [isOpen]);

  if (!selectedPackage || !formData) return null;

  const currentBalance = balance;
  const totalPrice = propTotalPrice ?? selectedPackage.price * purchaseQuantity;
  const totalItems = propTotalItems ?? selectedPackage.quantity * purchaseQuantity;
  const balanceAfter = currentBalance - totalPrice;
  const hasInsufficientBalance = balanceAfter < 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-primary/30 max-w-lg shadow-[0_0_50px_rgba(255,0,0,0.3)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl sm:text-2xl font-semibold text-foreground font-heading">
            Review Your Order
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-5 rounded-xl bg-background/70 border border-border/50 space-y-4">
            {/* Order ID - Compact and Highlighted */}
            <div className="flex justify-between items-center pb-4 border-b border-primary/20">
              <span className="text-sm font-medium text-[#B0B0B0]">
                Order ID
              </span>
              <span className="text-base font-bold text-primary bg-primary/15 px-4 py-1.5 rounded-md">
                {orderId}
              </span>
            </div>

            {/* Selected Package - Highlighted */}
            <div className="flex justify-between items-center pb-4 border-b border-border/50">
              <span className="text-sm font-medium text-[#B0B0B0]">
                Selected Package
              </span>
              <div className="text-right">
                <p className="text-base font-bold text-white">{selectedPackage.quantity} Diamonds</p>
                <p className="text-sm text-[#B0B0B0] flex items-center justify-end gap-1">
                  <span className="text-base">💎</span> {selectedPackage.quantity}
                </p>
              </div>
            </div>

            {/* Quantity Breakdown - Only show if quantity > 1 */}
            {purchaseQuantity > 1 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#B0B0B0]">Quantity</span>
                  <span className="text-sm font-bold text-white">
                    {purchaseQuantity} × {selectedPackage.quantity.toLocaleString()} Diamonds
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#B0B0B0]">Unit Price</span>
                  <span className="text-sm text-white">₹{selectedPackage.price.toLocaleString()} each</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                  <span className="text-sm font-medium text-white">Total Items</span>
                  <span className="text-sm font-bold text-primary">
                    💎 {totalItems.toLocaleString()} Diamonds
                  </span>
                </div>
              </div>
            )}

            {/* Game Details */}
            <div className="space-y-3 pb-4 border-b border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-[#B0B0B0]">In-Game UID</span>
                <span className="text-sm font-bold text-white">
                  {formData.uid}
                </span>
              </div>

              {formData.username && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#B0B0B0]">Username</span>
                  <span className="text-sm font-bold text-white">
                    {formData.username}
                  </span>
                </div>
              )}

              {formData.whatsapp && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#B0B0B0]">WhatsApp</span>
                  <span className="text-sm font-bold text-white">
                    {formData.whatsapp}
                  </span>
                </div>
              )}

              {user?.email && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#B0B0B0]">Email</span>
                  <span className="text-sm font-bold text-white">
                    {user.email}
                  </span>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-base font-bold text-white">Total Price</span>
                <span className="text-2xl font-extrabold text-primary">
                  ₹{totalPrice.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm bg-background/50 p-3 rounded-lg">
                <span className="text-[#B0B0B0]">Current Balance</span>
                <span className="font-bold text-white">₹{currentBalance.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-sm bg-background/50 p-3 rounded-lg">
                <span className="text-[#B0B0B0]">After Purchase</span>
                <span className={
                  balanceAfter >= 0 
                    ? "font-bold text-dashboard-green-bright" 
                    : "font-bold text-destructive"
                }>
                  ₹{balanceAfter.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Insufficient Credits Warning */}
          {hasInsufficientBalance && (
            <div className="p-4 rounded-xl bg-destructive/10 border-2 border-destructive/30 animate-pulse">
              <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Insufficient credits. Please add credits to continue.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel className="bg-muted hover:bg-muted/80 font-semibold px-6 py-3 h-12 rounded-xl">
            Edit Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={hasInsufficientBalance || isPlacingOrder}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 
              disabled:opacity-40 font-bold px-8 py-3 h-12 rounded-xl
              shadow-[0_0_20px_rgba(255,0,0,0.4)]"
          >
            {isPlacingOrder ? "Processing..." : "Confirm Purchase"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
