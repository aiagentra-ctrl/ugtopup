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
import { NetflixPackage } from "@/data/netflixPackages";
import { NetflixFormData } from "./NetflixUserInputForm";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";

interface NetflixOrderReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedPackage: NetflixPackage | null;
  formData: NetflixFormData | null;
  orderId: string;
}

export const NetflixOrderReview = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPackage,
  formData,
  orderId,
}: NetflixOrderReviewProps) => {
  const { user, profile } = useAuth();

  if (!selectedPackage || !formData) return null;

  const currentBalance = profile?.credits || 0;
  const totalPrice = selectedPackage.price;
  const balanceAfter = currentBalance - totalPrice;
  const hasInsufficientBalance = balanceAfter < 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-primary/30 shadow-[0_0_50px_rgba(255,0,0,0.3)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl">Review Your Order</AlertDialogTitle>
          <AlertDialogDescription>
            Please verify all details before confirming your subscription
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="pb-3 border-b border-border/20">
              <p className="text-sm text-muted-foreground mb-1">Order ID</p>
              <p className="font-bold text-base text-primary">{orderId}</p>
            </div>

            <div className="pb-3 border-b border-border/20">
              <p className="text-sm text-muted-foreground mb-1">Selected Plan</p>
              <p className="font-semibold text-base">{selectedPackage.name} 🎬</p>
              <p className="text-sm text-muted-foreground">{selectedPackage.duration}</p>
            </div>

            <div className="pb-3 border-b border-border/20">
              <p className="text-sm text-muted-foreground mb-1">WhatsApp Number</p>
              <p className="font-medium text-base">{formData.whatsapp}</p>
            </div>

            <div className="pb-3 border-b border-border/20">
              <p className="text-sm text-muted-foreground mb-1">Your Email Address</p>
              <p className="font-medium text-base break-all">{formData.email}</p>
            </div>

            <div className="pb-3 border-b border-border/20">
              <p className="text-sm text-muted-foreground mb-1">Your Account</p>
              <p className="font-medium text-base break-all">{user?.email}</p>
            </div>
          </div>

          <div className="bg-background/50 rounded-lg p-3 border border-border/50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Price</span>
              <span className="text-lg font-bold text-primary">
                ₹{totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Balance</span>
              <span className="text-base font-semibold">₹{currentBalance.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-border/50 flex justify-between items-center">
              <span className="text-sm font-medium">Balance After Purchase</span>
              <span className={`text-lg font-bold ${balanceAfter < 0 ? "text-destructive" : "text-green-500"}`}>
                ₹{balanceAfter.toLocaleString()}
              </span>
            </div>
          </div>

          {hasInsufficientBalance && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-destructive">Insufficient Balance</p>
                <p className="text-xs text-muted-foreground">
                  Please add ₹{Math.abs(balanceAfter).toLocaleString()} to your account to complete this purchase.
                </p>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="bg-muted hover:bg-muted/80">
            Edit Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={hasInsufficientBalance}
            className="bg-gradient-to-r from-primary via-red-600 to-secondary hover:opacity-90 disabled:opacity-40"
          >
            Confirm Purchase
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
