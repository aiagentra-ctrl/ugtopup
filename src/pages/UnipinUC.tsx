import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { UnipinProductHeader } from "@/components/unipin/UnipinProductHeader";
import { UnipinUserInputForm, UnipinFormData } from "@/components/unipin/UnipinUserInputForm";
import { UnipinPackageSelector } from "@/components/unipin/UnipinPackageSelector";
import { UnipinOrderReview } from "@/components/unipin/UnipinOrderReview";
import { UnipinSuccessModal } from "@/components/unipin/UnipinSuccessModal";
import { UnipinPackage } from "@/data/unipinPackages";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { createOrder, generateOrderNumber } from "@/lib/orderApi";
import { supabase } from "@/integrations/supabase/client";

import { GamePageDescription } from "@/components/GamePageDescription";

const UnipinUC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<UnipinFormData | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<UnipinPackage | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [voucherCode, setVoucherCode] = useState<string | null>(null);

  const handleFormDataChange = (data: UnipinFormData | null, isValid: boolean) => {
    setFormData(data);
    setIsFormValid(isValid && !!data?.email);
  };

  const generateShortOrderId = async (): Promise<string> => {
    return await generateOrderNumber();
  };

  const totalPrice = selectedPackage ? selectedPackage.price * purchaseQuantity : 0;
  const totalItems = selectedPackage ? selectedPackage.quantity * purchaseQuantity : 0;

  const handleReviewOrder = async () => {
    if (!user) {
      toast({
        title: "Please login",
        description: "You need to be logged in to make a purchase",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!formData || !formData.email) {
      toast({
        title: "Please enter your details",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPackage) {
      toast({
        title: "Please select a package",
        description: "Choose a Unipin UC package to continue",
        variant: "destructive",
      });
      return;
    }

    const newOrderId = await generateShortOrderId();
    setOrderId(newOrderId);
    setIsReviewOpen(true);
  };

  const handleConfirmPurchase = async (couponCode?: string, finalPrice?: number) => {
    if (!selectedPackage || !profile || !formData) return;

    const currentBalance = profile.balance || 0;

    if (currentBalance < totalPrice) {
      toast({
        title: "Insufficient Balance",
        description: "Please add credits to your account",
        variant: "destructive",
      });
      return;
    }

    try {
      const order = await createOrder({
        order_number: orderId,
        product_category: 'unipin',
        product_name: 'Unipin UC',
        package_name: selectedPackage.name,
        quantity: totalItems,
        price: finalPrice ?? totalPrice,
        coupon_code: couponCode,
        product_details: {
          email: formData.email,
          whatsapp: formData.whatsapp || "",
          purchase_quantity: purchaseQuantity,
          unit_price: selectedPackage.price,
          unit_quantity: selectedPackage.quantity,
        }
      });

      // Try to auto-assign voucher code
      let assignedCode: string | null = null;
      try {
        const { data: voucherResult } = await supabase.rpc('try_assign_voucher' as any, {
          p_order_id: order.id,
          p_game: 'unipin',
          p_package_id: selectedPackage.id || null,
        });
        if (voucherResult && (voucherResult as any).success && (voucherResult as any).code) {
          assignedCode = (voucherResult as any).code;
        }
      } catch (vErr) {
        console.error('Voucher assignment error:', vErr);
      }

      setVoucherCode(assignedCode);
      setIsReviewOpen(false);
      setIsSuccessOpen(true);

      toast({
        title: "Purchase Successful! 🎉",
        description: assignedCode
          ? `Your voucher code: ${assignedCode}`
          : `Your order ${orderId} is pending confirmation.`,
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Purchase Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleTopUpAgain = () => {
    setIsSuccessOpen(false);
    setFormData(null);
    setSelectedPackage(null);
    setPurchaseQuantity(1);
    setIsFormValid(false);
    setVoucherCode(null);
  };

  const canReviewOrder = isFormValid && selectedPackage;

  return (
    <div className="min-h-screen bg-background">
      <UnipinProductHeader />
      <GamePageDescription slug="unipin-uc" />
      
      <main className="container mx-auto px-4 py-6 pb-32">
        <div className="max-w-4xl mx-auto space-y-6">
          <UnipinUserInputForm 
            onDataChange={handleFormDataChange}
            initialData={formData || undefined}
          />

          <UnipinPackageSelector
            selectedPackage={selectedPackage}
            onSelectPackage={setSelectedPackage}
          />

          {selectedPackage && (
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <QuantitySelector
                value={purchaseQuantity}
                onChange={setPurchaseQuantity}
                min={1}
                max={10}
                label={`${selectedPackage.quantity.toLocaleString()} UC Points (₹${selectedPackage.price.toLocaleString()} each)`}
              />
              {purchaseQuantity > 1 && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  Total: {totalItems.toLocaleString()} UC Points = ₹{totalPrice.toLocaleString()}
                </p>
              )}
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-xl border-t border-border/40 z-40">
        <div className="container mx-auto max-w-4xl">
          <Button
            onClick={handleReviewOrder}
            disabled={!canReviewOrder}
            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-primary via-red-600 to-secondary hover:opacity-90 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] transition-all duration-300 disabled:opacity-50"
          >
            {!isFormValid
              ? "Enter Your Email"
              : !selectedPackage
              ? "Select a Voucher Package"
              : `Buy Now - ₹${totalPrice.toLocaleString()}`}
          </Button>
        </div>
      </div>

      <UnipinOrderReview
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={handleConfirmPurchase}
        selectedPackage={selectedPackage}
        formData={formData}
        orderId={orderId}
        purchaseQuantity={purchaseQuantity}
        totalPrice={totalPrice}
        totalItems={totalItems}
      />

      <UnipinSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        orderId={orderId}
        onTopUpAgain={handleTopUpAgain}
        voucherCode={voucherCode}
      />
    </div>
  );
};

export default UnipinUC;
