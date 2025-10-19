import { Package } from "@/data/freefirePackages";
import { UserFormData } from "./UserInputForm";
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
import { useAuth } from "@/contexts/AuthContext";

interface OrderReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedPackage: Package | null;
  formData: UserFormData | null;
  orderId: string;
}

export const OrderReview = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPackage,
  formData,
  orderId,
}: OrderReviewProps) => {
  const { user } = useAuth();

  if (!selectedPackage || !formData) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-card/95 backdrop-blur-xl border-primary/30 max-w-lg shadow-[0_0_50px_rgba(255,0,0,0.3)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Order Summary
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-base">
            Review your order details before purchase
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-5 py-6">
          <div className="p-5 rounded-xl bg-background/70 border border-border/50 space-y-4">
            {/* Order Number - Prominent */}
            <div className="flex justify-between items-center pb-4 border-b-2 border-primary/20">
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Order Number
              </span>
              <span className="text-lg font-mono font-bold text-primary bg-primary/10 px-3 py-1 rounded-lg">
                {orderId}
              </span>
            </div>

            {/* Selected Package - Highlighted */}
            <div className="flex justify-between items-center pb-4 border-b border-border/50">
              <span className="text-sm font-medium text-muted-foreground">
                Selected Package
              </span>
              <div className="text-right">
                <p className="text-base font-bold text-foreground">{selectedPackage.name}</p>
                <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                  <span className="text-lg">💎</span> {selectedPackage.quantity}
                </p>
              </div>
            </div>

            {/* Game Details */}
            <div className="space-y-3 pb-4 border-b border-border/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">In-Game UID</span>
                <span className="text-sm font-mono font-semibold text-foreground">
                  {formData.uid}
                </span>
              </div>

              {formData.username && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Username</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formData.username}
                  </span>
                </div>
              )}

              {formData.whatsapp && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">WhatsApp</span>
                  <span className="text-sm font-mono font-semibold text-foreground">
                    {formData.whatsapp}
                  </span>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-center pt-3">
                <span className="text-base font-bold text-foreground">Total Price</span>
                <span className="text-3xl font-extrabold text-primary">
                  ₹{selectedPackage.price}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm bg-background/50 p-3 rounded-lg">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-bold text-foreground">₹{user?.balance || 0}</span>
              </div>

              <div className="flex justify-between items-center text-sm bg-background/50 p-3 rounded-lg">
                <span className="text-muted-foreground">After Purchase</span>
                <span className={
                  (user?.balance || 0) - selectedPackage.price >= 0 
                    ? "font-bold text-dashboard-green-bright" 
                    : "font-bold text-destructive"
                }>
                  ₹{(user?.balance || 0) - selectedPackage.price}
                </span>
              </div>
            </div>
          </div>

          {/* Insufficient Credits Warning */}
          {(user?.balance || 0) < selectedPackage.price && (
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
            disabled={(user?.balance || 0) < selectedPackage.price}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 
              disabled:opacity-40 font-bold px-8 py-3 h-12 rounded-xl
              shadow-[0_0_20px_rgba(255,0,0,0.4)]"
          >
            Confirm Purchase
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
