import { useState } from "react";
import { YouTubeProductHeader } from "@/components/youtube/YouTubeProductHeader";
import { YouTubeUserInputForm, YouTubeFormData } from "@/components/youtube/YouTubeUserInputForm";
import { YouTubePackageSelector } from "@/components/youtube/YouTubePackageSelector";
import { YouTubeOrderReview } from "@/components/youtube/YouTubeOrderReview";
import { YouTubeSuccessModal } from "@/components/youtube/YouTubeSuccessModal";
import { YouTubePackage } from "@/data/youtubePackages";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createOrder, generateOrderNumber } from "@/lib/orderApi";

const YouTube = () => {
  const [formData, setFormData] = useState<YouTubeFormData | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<YouTubePackage | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [showOrderReview, setShowOrderReview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  const { profile } = useAuth();

  const handleFormDataChange = (data: YouTubeFormData | null, isValid: boolean) => {
    setFormData(data);
    setIsFormValid(isValid);
  };

  const generateOrderId = async () => {
    return await generateOrderNumber();
  };

  const totalPrice = selectedPackage ? selectedPackage.price * purchaseQuantity : 0;

  const handleBuyNow = async () => {
    if (!formData || !selectedPackage) {
      toast.error("Please complete all required fields");
      return;
    }
    const newOrderId = await generateOrderId();
    setOrderId(newOrderId);
    setShowOrderReview(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage || !formData || !profile) return;

    const newBalance = profile.balance - totalPrice;
    
    if (newBalance < 0) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      await createOrder({
        order_number: orderId,
        product_category: 'youtube',
        product_name: 'YouTube Premium',
        package_name: selectedPackage.name,
        quantity: purchaseQuantity,
        price: totalPrice,
        product_details: {
          email: formData.email,
          purchase_quantity: purchaseQuantity,
          unit_price: selectedPackage.price,
        }
      });

      setShowOrderReview(false);
      setShowSuccessModal(true);
      
      toast.success("Subscription order placed successfully!");
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.message || "Failed to place order");
    }
  };

  const handleSubscribeAgain = () => {
    setShowSuccessModal(false);
    setFormData(null);
    setSelectedPackage(null);
    setPurchaseQuantity(1);
    setOrderId("");
  };

  const isFormComplete = isFormValid && selectedPackage !== null;

  const getButtonText = () => {
    if (!formData) return "Enter Details to Subscribe";
    if (!selectedPackage) return "Select Plan to Subscribe";
    return `Subscribe Now - ₹${totalPrice.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <YouTubeProductHeader />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        <YouTubeUserInputForm onDataChange={handleFormDataChange} initialData={formData || undefined} />
        <YouTubePackageSelector 
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
              label={`${selectedPackage.name} (₹${selectedPackage.price.toLocaleString()} each)`}
            />
            {purchaseQuantity > 1 && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                Total: ₹{totalPrice.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border/50 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-40">
        <div className="container mx-auto">
          <Button
            onClick={handleBuyNow}
            disabled={!isFormComplete}
            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-primary via-red-600 to-secondary hover:opacity-90 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] transition-all duration-300 hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100"
          >
            {getButtonText()}
          </Button>
        </div>
      </div>

      <YouTubeOrderReview
        isOpen={showOrderReview}
        onClose={() => setShowOrderReview(false)}
        onConfirm={handleConfirmPurchase}
        selectedPackage={selectedPackage}
        formData={formData}
        orderId={orderId}
        purchaseQuantity={purchaseQuantity}
        totalPrice={totalPrice}
      />

      <YouTubeSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderId={orderId}
        onSubscribeAgain={handleSubscribeAgain}
      />
    </div>
  );
};

export default YouTube;
