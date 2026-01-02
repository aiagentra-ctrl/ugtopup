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
import { SmileCoinPackage } from "@/data/smileCoinPackages";
import { SmileCoinFormData } from "./SmileCoinUserInputForm";
import { useAuth } from "@/contexts/AuthContext";

interface SmileCoinOrderReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedPackage: SmileCoinPackage | null;
  formData: SmileCoinFormData | null;
  orderId: string;
  purchaseQuantity: number;
  totalPrice: number;
  totalItems: number;
}

export const SmileCoinOrderReview = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPackage,
  formData,
  orderId,
  purchaseQuantity,
  totalPrice,
  totalItems,
}: SmileCoinOrderReviewProps) => {
  const { user, profile } = useAuth();

  if (!selectedPackage || !formData) return null;

  const currentBalance = profile?.balance || 0;
  const balanceAfter = currentBalance - totalPrice;
  const hasInsufficientBalance = balanceAfter < 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-primary/30 shadow-[0_0_50px_rgba(255,0,0,0.3)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl sm:text-2xl font-semibold text-foreground font-heading">
            Review Your Order
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Please review your order details before confirming
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center pb-4 border-b border-primary/20">
            <span className="text-sm font-medium text-muted-foreground">Order ID</span>
            <span className="text-base font-bold text-primary bg-primary/15 px-4 py-1.5 rounded-md">
              {orderId}
            </span>
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground">Selected Package</span>
              <div className="text-right">
                <p className="text-base font-bold text-foreground">
                  {selectedPackage.name}
                  {purchaseQuantity > 1 && ` × ${purchaseQuantity}`}
                </p>
                <p className="text-sm text-primary">
                  {purchaseQuantity > 1 
                    ? `${totalItems.toLocaleString()} Coins` 
                    : `${selectedPackage.quantity.toLocaleString()} Coins`}
                </p>
              </div>
            </div>

            {purchaseQuantity > 1 && (
              <div className="flex justify-between items-center pt-2 border-t border-border/30">
                <span className="text-sm font-medium text-muted-foreground">Unit Price</span>
                <span className="text-sm font-semibold text-foreground">₹{selectedPackage.price.toLocaleString()} each</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-border/30">
              <span className="text-sm font-medium text-muted-foreground">Email Address</span>
              <span className="text-sm font-semibold text-foreground">{formData.email}</span>
            </div>

            {formData.whatsapp && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">WhatsApp</span>
                <span className="text-sm font-semibold text-foreground">{formData.whatsapp}</span>
              </div>
            )}

            {user?.email && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Account Email</span>
                <span className="text-sm font-semibold text-foreground">{user.email}</span>
              </div>
            )}
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-background/50 border border-border/50">
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-white">Total Price</span>
              <span className="text-2xl font-extrabold text-primary">
                ₹{totalPrice.toLocaleString()}
              </span>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/30">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-semibold text-dashboard-green">₹{currentBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Balance After Purchase</span>
                <span className={`font-bold ${balanceAfter >= 0 ? "text-dashboard-green" : "text-destructive"}`}>
                  ₹{balanceAfter.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {hasInsufficientBalance && (
            <div className="p-4 rounded-xl bg-destructive/10 border-2 border-destructive/30">
              <p className="text-sm font-semibold text-destructive">
                Insufficient balance. Please add credits to continue.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-3">
          <AlertDialogCancel className="bg-muted hover:bg-muted/80 font-semibold px-6 py-3 h-12 rounded-xl w-full sm:w-auto">
            Edit Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={hasInsufficientBalance}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-40 font-bold px-8 py-3 h-12 rounded-xl shadow-[0_0_20px_rgba(255,0,0,0.4)] w-full sm:w-auto"
          >
            Confirm Purchase
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
