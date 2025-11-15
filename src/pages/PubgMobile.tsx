import { useState } from "react";
import { PubgProductHeader } from "@/components/pubg/PubgProductHeader";
import { PubgUserInputForm, PubgFormData } from "@/components/pubg/PubgUserInputForm";
import { PubgPackageSelector } from "@/components/pubg/PubgPackageSelector";
import { PubgOrderReview } from "@/components/pubg/PubgOrderReview";
import { PubgSuccessModal } from "@/components/pubg/PubgSuccessModal";
import { PubgPackage } from "@/data/pubgPackages";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { createOrder, generateOrderNumber } from "@/lib/orderApi";

const PubgMobile = () => {
  const [formData, setFormData] = useState<PubgFormData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PubgPackage | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFormDataChange = (data: PubgFormData) => {
    setFormData(data);
    setIsFormValid(
      data.pubgId.length >= 6 && 
      (data.username.length === 0 || data.username.length >= 3)
    );
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
        description: "Please enter a valid PUBG ID (minimum 6 characters)",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPackage) {
      toast({
        title: "No Package Selected",
        description: "Please select a UC package",
        variant: "destructive",
      });
      return;
    }

    const newOrderId = await generateOrderNumber();
    setOrderId(newOrderId);
    setIsReviewOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!user || !selectedPackage || !formData || !profile) return;
    
    if (profile.balance < selectedPackage.price) {
      toast({
        title: "Insufficient Credits",
        description: "Please add credits to your account",
        variant: "destructive",
      });
      return;
    }

    try {
      await createOrder({
        order_number: orderId,
        product_category: 'pubg',
        product_name: 'PUBG Mobile UC',
        package_name: selectedPackage.name,
        quantity: selectedPackage.quantity,
        price: selectedPackage.price,
        product_details: {
          pubgId: formData.pubgId,
          username: formData.username,
          whatsapp: formData.whatsapp || "",
        }
      });

      setIsReviewOpen(false);
      setIsSuccessOpen(true);

      toast({
        title: "Order Placed Successfully!",
        description: `Your order ${orderId} is pending confirmation`,
        className: "bg-dashboard-green/20 border-dashboard-green-bright",
      });
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
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
      <PubgProductHeader />

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-6xl animate-fade-in">
        <section>
          <PubgUserInputForm
            onDataChange={handleFormDataChange}
            initialData={formData || undefined}
          />
        </section>

        <section>
          <PubgPackageSelector
            selectedPackage={selectedPackage}
            onSelectPackage={setSelectedPackage}
          />
        </section>

        <div className="h-20"></div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/98 backdrop-blur-xl border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.3)]">
        <div className="container mx-auto max-w-6xl">
          <Button
            onClick={handleReviewOrder}
            disabled={!canReviewOrder}
            className="w-full h-16 text-lg sm:text-xl font-bold rounded-2xl 
              bg-gradient-to-r from-primary via-red-600 to-secondary 
              hover:opacity-90 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] 
              hover:scale-[1.02] active:scale-[0.98] 
              transition-all duration-300 
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
              relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            
            <span className="relative z-10">
              {!isFormValid
                ? "Enter Details to Buy"
                : !selectedPackage
                ? "Select Package to Buy"
                : `Buy Now - ₹${selectedPackage.price}`}
            </span>
          </Button>
        </div>
      </div>

      <PubgOrderReview
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={handleConfirmPurchase}
        selectedPackage={selectedPackage}
        formData={formData}
        orderId={orderId}
      />

      <PubgSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        orderId={orderId}
        onTopUpAgain={handleTopUpAgain}
      />
    </div>
  );
};

export default PubgMobile;
