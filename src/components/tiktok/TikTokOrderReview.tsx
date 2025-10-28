import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TikTokPackage } from "@/data/tiktokPackages";
import { TikTokFormData } from "./TikTokUserInputForm";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";

interface TikTokOrderReviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedPackage: TikTokPackage | null;
  formData: TikTokFormData | null;
  orderId: string;
}

export const TikTokOrderReview = ({
  isOpen,
  onClose,
  onConfirm,
  selectedPackage,
  formData,
  orderId,
}: TikTokOrderReviewProps) => {
  const { user, profile } = useAuth();

  if (!selectedPackage || !formData) return null;

  const currentBalance = profile?.balance || 0;
  const totalPrice = selectedPackage.price;
  const balanceAfter = currentBalance - totalPrice;
  const hasInsufficientBalance = balanceAfter < 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-primary/30 shadow-[0_0_50px_rgba(255,0,0,0.3)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl sm:text-2xl font-semibold text-foreground">
            Review Your Order
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left text-muted-foreground">
            Review your order details before confirming
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Order ID - More Prominent */}
        <div className="flex justify-between items-center pb-4 border-b border-primary/20">
          <span className="text-sm font-medium text-muted-foreground">Order ID</span>
          <span className="text-base font-bold text-primary bg-primary/15 px-4 py-1.5 rounded-md">
            {orderId}
          </span>
        </div>

        <div className="space-y-4 py-2">
          {/* Order Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Order Details</h3>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Selected Package</span>
              <span className="font-semibold flex items-center gap-1">
                {selectedPackage.quantity.toLocaleString()} Coins 🪙
              </span>
            </div>

            <Separator />

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">TikTok Username</span>
              <span className="font-semibold">{formData.username}</span>
            </div>

            <Separator />

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">TikTok Password</span>
              <span className="font-mono text-sm">•••••••••</span>
            </div>

            <Separator />

            {formData.whatsapp && (
              <>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">WhatsApp</span>
                  <span className="font-semibold">{formData.whatsapp}</span>
                </div>
                <Separator />
              </>
            )}

            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-semibold text-sm">{user?.email}</span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Price Breakdown */}
          <div className="space-y-3 bg-background/50 rounded-xl p-4 border border-border/50">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Price Summary</h3>
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-bold text-foreground">Total Price</span>
              <span className="text-2xl font-extrabold text-primary">
                {selectedPackage.currency}{totalPrice.toLocaleString()}
              </span>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Current Balance</span>
                <span className="font-semibold text-foreground">{selectedPackage.currency}{currentBalance}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">After Purchase</span>
                <span className={`font-bold ${balanceAfter < 0 ? 'text-destructive' : 'text-green-500'}`}>
                  {selectedPackage.currency}{balanceAfter}
                </span>
              </div>
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {hasInsufficientBalance && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border-2 border-destructive/30 animate-pulse">
              <span className="text-xl">⚠️</span>
              <p className="text-sm text-destructive font-semibold">
                Insufficient credits. Please add credits to continue.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 font-semibold px-6 py-3 h-12 rounded-xl bg-muted hover:bg-muted/80"
          >
            Edit Order
          </Button>
          <Button
            onClick={onConfirm}
            disabled={hasInsufficientBalance}
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-40 text-white font-bold px-8 py-3 h-12 rounded-xl shadow-[0_0_20px_rgba(255,0,0,0.4)]"
          >
            Confirm Purchase
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
