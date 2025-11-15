import { useState } from "react";
import { ProductHeader } from "@/components/freefire/ProductHeader";
import { UserInputForm, UserFormData } from "@/components/freefire/UserInputForm";
import { PackageSelector } from "@/components/freefire/PackageSelector";
import { OrderReview } from "@/components/freefire/OrderReview";
import { SuccessModal } from "@/components/freefire/SuccessModal";
import { Package } from "@/data/freefirePackages";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { createOrder, generateOrderNumber } from "@/lib/orderApi";
import { ensureSufficientBalance } from "@/lib/creditApi";
import { requestDeduplicator } from "@/lib/requestDeduplicator";

const FreefireDiamond = () => {
  const [formData, setFormData] = useState<UserFormData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFormDataChange = (data: UserFormData) => {
    setFormData(data);
    setIsFormValid(
      data.uid.length >= 6 && 
      /^\d+$/.test(data.uid)
      // WhatsApp is now optional, so no check needed
    );
  };

  const generateShortOrderId = async () => {
    return await generateOrderNumber();
  };

  const handleReviewOrder = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to place an order",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!isFormValid) {
      toast({
        title: "Invalid Details",
        description: "Please enter a valid UID",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPackage) {
      toast({
        title: "No Package Selected",
        description: "Please select a diamond package",
        variant: "destructive",
      });
      return;
    }

    // Check balance from DB before opening review
    const { ok, balance } = await ensureSufficientBalance(selectedPackage.price);
    if (!ok) {
      toast({
        title: "Insufficient Credits",
        description: `You have ₹${balance} credits, but need ₹${selectedPackage.price}. Please top up.`,
        variant: "destructive",
      });
      return;
    }

    const newOrderId = await generateShortOrderId();
    setOrderId(newOrderId);
    setIsReviewOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!user || !selectedPackage || !formData || isPlacingOrder) return;
    
    setIsPlacingOrder(true);
    
    try {
      // Create order with deduplication
      await requestDeduplicator.dedupe(
        `place_order:${user.id}:${selectedPackage.name}`,
        async () => {
          await createOrder({
            order_number: orderId,
            product_category: 'freefire',
            product_name: 'Free Fire Diamond',
            package_name: selectedPackage.name,
            quantity: selectedPackage.quantity,
            price: selectedPackage.price,
            product_details: {
              uid: formData.uid,
              username: formData.username || "Not provided",
              whatsapp: formData.whatsapp || "",
            }
          });
        }
      );

      // Refresh profile to update balance immediately
      await refreshProfile();

      // Close review, show success
      setIsReviewOpen(false);
      setIsSuccessOpen(true);

      toast({
        title: "Order Placed Successfully!",
        description: `Your order ${orderId} is pending confirmation`,
        className: "bg-dashboard-green/20 border-dashboard-green-bright",
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      
      // Refresh balance on error
      await refreshProfile();
      
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleTopUpAgain = () => {
    setSelectedPackage(null);
    setFormData(null);
    setIsFormValid(false);
    setIsSuccessOpen(false);
  };

  const canReviewOrder = isFormValid && selectedPackage !== null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <ProductHeader />

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-6xl animate-fade-in">
        {/* User Input Section */}
        <section>
          <UserInputForm
            onDataChange={handleFormDataChange}
            initialData={formData || undefined}
          />
        </section>

        {/* Package Selection Section */}
        <section>
          <PackageSelector
            selectedPackage={selectedPackage}
            onSelectPackage={setSelectedPackage}
          />
        </section>

        {/* Continue Button - Fixed Bottom */}
        <div className="h-20"></div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/98 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        <div className="container mx-auto max-w-6xl">
          <Button
            onClick={handleReviewOrder}
            disabled={!isFormValid || !selectedPackage || isPlacingOrder}
            className="w-full h-16 text-lg sm:text-xl font-bold rounded-2xl 
              bg-gradient-to-r from-primary via-red-600 to-secondary 
              hover:opacity-90 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] 
              hover:scale-[1.02] active:scale-[0.98] 
              transition-all duration-300 
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
              relative overflow-hidden group"
          >
            {/* Animated Background Shine */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            
            <span className="relative z-10">
              {isPlacingOrder
                ? "Processing..."
                : !isFormValid
                ? "Enter Details to Buy"
                : !selectedPackage
                ? "Select Package to Buy"
                : `Buy Now - ₹${selectedPackage.price}`}
            </span>
          </Button>
        </div>
      </div>

      {/* Order Review Modal */}
        <OrderReview
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          onConfirm={handleConfirmPurchase}
          selectedPackage={selectedPackage}
          formData={formData}
          orderId={orderId}
          isPlacingOrder={isPlacingOrder}
        />

      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        orderId={orderId}
        onTopUpAgain={handleTopUpAgain}
      />
    </div>
  );
};

export default FreefireDiamond;
