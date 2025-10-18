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
      <AlertDialogContent className="bg-card border-primary/20 max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-bold text-foreground">
            Review Your Order
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Please verify your order details before confirming
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-background/50 border border-border space-y-3">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Order ID</span>
              <span className="text-sm font-mono text-foreground">{orderId}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Package</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-foreground">{selectedPackage.name}</p>
                <p className="text-xs text-muted-foreground">{selectedPackage.quantity} 💎</p>
              </div>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">In-Game UID</span>
              <span className="text-sm font-mono text-foreground">{formData.uid}</span>
            </div>

            {formData.username && (
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Username</span>
                <span className="text-sm text-foreground">{formData.username}</span>
              </div>
            )}

            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">WhatsApp Number</span>
              <span className="text-sm font-mono text-foreground">{formData.whatsapp}</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Payment Method</span>
              <span className="text-sm text-foreground">Credit Balance</span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm text-foreground">{user?.email}</span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-semibold text-foreground">Total Amount</span>
              <span className="text-2xl font-bold text-primary">
                {selectedPackage.price}{selectedPackage.currency}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="text-foreground">{user?.balance || 0}💵</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">After Purchase</span>
              <span className={
                (user?.balance || 0) - selectedPackage.price >= 0 
                  ? "text-dashboard-green-bright" 
                  : "text-destructive"
              }>
                {(user?.balance || 0) - selectedPackage.price}💵
              </span>
            </div>
          </div>

          {(user?.balance || 0) < selectedPackage.price && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                ⚠️ Insufficient credits. Please add credits to your account.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted hover:bg-muted/80">
            Edit Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={(user?.balance || 0) < selectedPackage.price}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50"
          >
            Confirm Purchase
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
