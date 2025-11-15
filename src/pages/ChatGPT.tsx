import { useState } from "react";
import { ChatGPTProductHeader } from "@/components/chatgpt/ChatGPTProductHeader";
import { ChatGPTUserInputForm, ChatGPTFormData } from "@/components/chatgpt/ChatGPTUserInputForm";
import { ChatGPTPackageSelector } from "@/components/chatgpt/ChatGPTPackageSelector";
import { ChatGPTOrderReview } from "@/components/chatgpt/ChatGPTOrderReview";
import { ChatGPTSuccessModal } from "@/components/chatgpt/ChatGPTSuccessModal";
import { ChatGPTPackage } from "@/data/chatgptPackages";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createOrder, generateOrderNumber } from "@/lib/orderApi";

const ChatGPT = () => {
  const [formData, setFormData] = useState<ChatGPTFormData | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ChatGPTPackage | null>(null);
  const [showOrderReview, setShowOrderReview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  const { profile } = useAuth();

  const handleFormDataChange = (data: ChatGPTFormData | null, isValid: boolean) => {
    setFormData(data);
    setIsFormValid(isValid);
  };

  const generateOrderId = async () => {
    return await generateOrderNumber();
  };

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

    const newBalance = profile.balance - selectedPackage.price;
    
    if (newBalance < 0) {
      toast.error("Insufficient balance");
      return;
    }

    try {
      await createOrder({
        order_number: orderId,
        product_category: 'chatgpt',
        product_name: 'ChatGPT Plus',
        package_name: selectedPackage.name,
        quantity: 1,
        price: selectedPackage.price,
        product_details: {
          email: formData.email,
          password: formData.password,
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

  const isFormComplete = isFormValid && selectedPackage !== null;

  const getButtonText = () => {
    if (!formData) return "Enter Details to Subscribe";
    if (!selectedPackage) return "Select Plan to Subscribe";
    return `Subscribe Now - ₹${selectedPackage.price.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <ChatGPTProductHeader />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        <ChatGPTUserInputForm onDataChange={handleFormDataChange} initialData={formData || undefined} />
        <ChatGPTPackageSelector 
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

      <ChatGPTOrderReview
        isOpen={showOrderReview}
        onClose={() => setShowOrderReview(false)}
        onConfirm={handleConfirmPurchase}
        selectedPackage={selectedPackage}
        formData={formData}
        orderId={orderId}
      />

      <ChatGPTSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderId={orderId}
        onSubscribeAgain={handleSubscribeAgain}
      />
    </div>
  );
};

export default ChatGPT;
