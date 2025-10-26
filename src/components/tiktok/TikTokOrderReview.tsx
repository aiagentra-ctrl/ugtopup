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
      <AlertDialogContent className="max-w-md glass-card border-border/50">
        <AlertDialogHeader>
          <div className="flex items-center justify-between mb-2">
            <AlertDialogTitle className="text-2xl">Order Summary</AlertDialogTitle>
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#FE2C55] to-[#25F4EE] text-white text-xs font-bold">
              {orderId}
            </div>
          </div>
          <AlertDialogDescription className="text-left">
            Review your order details before confirming
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Order Details</h3>
            
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
          <div className="space-y-3 bg-card/50 rounded-lg p-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Price Summary</h3>
            
            <div className="flex justify-between items-center">
              <span className="text-base font-medium">Total Price</span>
              <span className="text-2xl font-bold text-[#FE2C55]">
                {selectedPackage.currency}{totalPrice.toLocaleString()}
              </span>
            </div>

            <Separator />

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Current Balance</span>
              <span className="font-semibold">{selectedPackage.currency}{currentBalance}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">After Purchase</span>
              <span className={`font-bold ${balanceAfter < 0 ? 'text-destructive' : 'text-green-500'}`}>
                {selectedPackage.currency}{balanceAfter}
              </span>
            </div>
          </div>

          {/* Insufficient Balance Warning */}
          {hasInsufficientBalance && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/50 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <p className="text-sm text-destructive font-medium">
                Insufficient credits. Please add credits to continue.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Edit Order
          </Button>
          <Button
            onClick={onConfirm}
            disabled={hasInsufficientBalance}
            className="flex-1 bg-gradient-to-r from-[#FE2C55] to-[#25F4EE] hover:opacity-90 text-white"
          >
            Confirm Purchase
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
