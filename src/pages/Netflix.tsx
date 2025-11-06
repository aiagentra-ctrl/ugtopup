import { useState } from "react";
import { NetflixProductHeader } from "@/components/netflix/NetflixProductHeader";
import { NetflixUserInputForm, NetflixFormData } from "@/components/netflix/NetflixUserInputForm";
import { NetflixPackageSelector } from "@/components/netflix/NetflixPackageSelector";
import { NetflixOrderReview } from "@/components/netflix/NetflixOrderReview";
import { NetflixSuccessModal } from "@/components/netflix/NetflixSuccessModal";
import { NetflixPackage } from "@/data/netflixPackages";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createOrder, generateOrderNumber } from "@/lib/orderApi";

const Netflix = () => {
  const [formData, setFormData] = useState<NetflixFormData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<NetflixPackage | null>(null);
  const [showOrderReview, setShowOrderReview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  const { profile } = useAuth();

  const generateOrderId = () => {
    return generateOrderNumber();
  };

  const handleBuyNow = () => {
    if (!formData || !selectedPackage) {
      toast.error("Please complete all required fields");
      return;
    }
    const newOrderId = generateOrderId();
    setOrderId(newOrderId);
    setShowOrderReview(true);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage || !formData || !profile) return;

    const newBalance = profile.balance - selectedPackage.price;
    
    if (newBalance < 0) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      await createOrder({
        order_number: orderId,
        product_category: 'netflix',
        product_name: 'Netflix Subscription',
        package_name: selectedPackage.name,
        quantity: 1,
        price: selectedPackage.price,
        product_details: {
          email: formData.email,
          whatsapp: formData.whatsapp || "",
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
    setOrderId("");
  };

  const isFormComplete = formData !== null && selectedPackage !== null;

  const getButtonText = () => {
    if (!formData) return "Enter Details to Subscribe";
    if (!selectedPackage) return "Select Plan to Subscribe";
    return `Subscribe Now - ₹${selectedPackage.price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <NetflixProductHeader />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        <NetflixUserInputForm onDataChange={setFormData} initialData={formData || undefined} />
        <NetflixPackageSelector 
          selectedPackage={selectedPackage} 
          onSelectPackage={setSelectedPackage} 
        />
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

      <NetflixOrderReview
        isOpen={showOrderReview}
        onClose={() => setShowOrderReview(false)}
        onConfirm={handleConfirmPurchase}
        selectedPackage={selectedPackage}
        formData={formData}
        orderId={orderId}
      />

      <NetflixSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderId={orderId}
        onSubscribeAgain={handleSubscribeAgain}
      />
    </div>
  );
};

export default Netflix;
