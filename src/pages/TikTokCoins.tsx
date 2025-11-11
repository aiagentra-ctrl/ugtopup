import { useState } from "react";
import { TikTokProductHeader } from "@/components/tiktok/TikTokProductHeader";
import { TikTokUserInputForm, TikTokFormData } from "@/components/tiktok/TikTokUserInputForm";
import { TikTokPackageSelector } from "@/components/tiktok/TikTokPackageSelector";
import { TikTokOrderReview } from "@/components/tiktok/TikTokOrderReview";
import { TikTokSuccessModal } from "@/components/tiktok/TikTokSuccessModal";
import { TikTokPackage } from "@/data/tiktokPackages";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { createOrder, generateOrderNumber } from "@/lib/orderApi";

const TikTokCoins = () => {
  const [formData, setFormData] = useState<TikTokFormData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<TikTokPackage | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const { user, profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFormDataChange = (data: TikTokFormData) => {
    setFormData(data);
    setIsFormValid(
      data.username.length >= 3 && 
      data.password.length >= 6
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
        description: "Please enter valid TikTok username and password",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPackage) {
      toast({
        title: "No Package Selected",
        description: "Please select a coin package",
        variant: "destructive",
      });
      return;
    }

    const newOrderId = await generateShortOrderId();
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
        product_category: 'tiktok',
        product_name: 'TikTok Coins',
        package_name: selectedPackage.name,
        quantity: selectedPackage.quantity,
        price: selectedPackage.price,
        product_details: {
          username: formData.username,
          password: formData.password,
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
      <TikTokProductHeader />

      <main className="container mx-auto px-4 py-8 space-y-8 max-w-6xl animate-fade-in">
        <section>
          <TikTokUserInputForm
            onDataChange={handleFormDataChange}
            initialData={formData || undefined}
          />
        </section>

        <section>
          <TikTokPackageSelector
            selectedPackage={selectedPackage}
            onSelectPackage={setSelectedPackage}
          />
        </section>

        <div className="h-20"></div>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-destructive/95 backdrop-blur-xl border-t border-destructive shadow-[0_-4px_24px_rgba(220,38,38,0.4)]">
        <div className="container mx-auto max-w-6xl">
          <Button
            onClick={handleReviewOrder}
            disabled={!canReviewOrder}
            className="w-full h-16 text-lg sm:text-xl font-bold rounded-2xl 
              bg-gradient-to-r from-destructive via-red-600 to-destructive 
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
                : `Buy Now - ₹${selectedPackage.price.toLocaleString()}`}
            </span>
          </Button>
        </div>
      </div>

      <TikTokOrderReview
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={handleConfirmPurchase}
        selectedPackage={selectedPackage}
        formData={formData}
        orderId={orderId}
      />

      <TikTokSuccessModal
        isOpen={isSuccessOpen}
        onClose={() => setIsSuccessOpen(false)}
        orderId={orderId}
        onTopUpAgain={handleTopUpAgain}
      />
    </div>
  );
};

export default TikTokCoins;
