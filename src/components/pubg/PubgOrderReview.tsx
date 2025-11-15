import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PubgPackage } from "@/data/pubgPackages";
import { PubgFormData } from "./PubgUserInputForm";
import { useLiveBalance } from "@/hooks/useLiveBalance";
import { useEffect } from "react";

interface PubgOrderReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedPackage: PubgPackage | null;
  formData: PubgFormData | null;
  orderId: string;
  isPlacingOrder?: boolean;
}

export const PubgOrderReview = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPackage,
  formData,
  orderId,
  isPlacingOrder = false,
}: PubgOrderReviewProps) => {
  const { balance, fetchNow } = useLiveBalance();

  useEffect(() => {
    if (isOpen) {
      fetchNow();
    }
  }, [isOpen]);

  if (!selectedPackage || !formData) return null;

  const currentBalance = balance;
  const totalPrice = selectedPackage.price;
  const balanceAfter = currentBalance - totalPrice;
  const hasInsufficientBalance = balanceAfter < 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-foreground">
            Review Your Order
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Please review your order details before confirming
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 my-6">
          <div className="p-4 rounded-lg bg-background/50 border border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="font-mono font-bold text-primary">{orderId}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Package</span>
              <span className="font-semibold text-foreground">{selectedPackage.name}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">PUBG ID</span>
              <span className="font-semibold text-foreground">{formData.pubgId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Username</span>
              <span className="font-semibold text-foreground">{formData.username}</span>
            </div>

            {formData.whatsapp && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">WhatsApp</span>
                <span className="font-semibold text-foreground">{formData.whatsapp}</span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Current Balance</span>
              <span className="font-bold text-foreground">₹{currentBalance}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Total Cost</span>
              <span className="font-bold text-primary text-lg">₹{totalPrice}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Balance After</span>
              <span className={`font-bold ${balanceAfter >= 0 ? 'text-dashboard-green-bright' : 'text-destructive'}`}>
                ₹{balanceAfter}
              </span>
            </div>
            {hasInsufficientBalance && (
              <p className="text-xs text-destructive bg-destructive/10 p-2 rounded mt-3">
                ⚠️ Insufficient balance. Please add credits to your account.
              </p>
            )}
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="hover:bg-muted">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={hasInsufficientBalance || isPlacingOrder}
            className="bg-gradient-to-r from-primary via-red-600 to-secondary hover:opacity-90 disabled:opacity-40"
          >
            {isPlacingOrder ? "Processing..." : "Confirm Purchase"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
