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

const ChatGPT = () => {
  const [formData, setFormData] = useState<ChatGPTFormData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ChatGPTPackage | null>(null);
  const [showOrderReview, setShowOrderReview] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderId, setOrderId] = useState("");
  const { profile, setProfile } = useAuth();

  const generateOrderId = () => {
    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    return `ORD-${String(orders.length + 1).padStart(3, "0")}`;
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

  const handleConfirmPurchase = () => {
    if (!selectedPackage || !formData || !profile) return;

    const newBalance = profile.credits - selectedPackage.price;
    
    if (newBalance < 0) {
      toast.error("Insufficient balance");
      return;
    }

    const order = {
      id: orderId,
      product: "ChatGPT Plus",
      package: selectedPackage.name,
      price: selectedPackage.price,
      email: formData.email,
      date: new Date().toISOString(),
      status: "Processing",
    };

    const orders = JSON.parse(localStorage.getItem("orders") || "[]");
    orders.push(order);
    localStorage.setItem("orders", JSON.stringify(orders));
    
    window.dispatchEvent(new Event("storage"));

    setProfile({ ...profile, credits: newBalance });

    setShowOrderReview(false);
    setShowSuccessModal(true);
    
    toast.success("Subscription successful!");
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
      <ChatGPTProductHeader />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        <ChatGPTUserInputForm onDataChange={setFormData} initialData={formData || undefined} />
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
