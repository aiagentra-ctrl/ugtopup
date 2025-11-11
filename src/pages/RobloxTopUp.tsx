import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { RobloxProductHeader } from "@/components/roblox/RobloxProductHeader";
import { RobloxUserInputForm } from "@/components/roblox/RobloxUserInputForm";
import { RobloxPackageSelector } from "@/components/roblox/RobloxPackageSelector";
import { RobloxOrderReview } from "@/components/roblox/RobloxOrderReview";
import { RobloxSuccessModal } from "@/components/roblox/RobloxSuccessModal";
import { type RobloxPackage } from "@/data/robloxPackages";
import { Button } from "@/components/ui/button";
import { createOrder, generateOrderNumber } from "@/lib/orderApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const RobloxTopUp = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    whatsapp: "",
  });
  
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [selectedPackage, setSelectedPackage] = useState<RobloxPackage | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};
    
    if (!formData.username || formData.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }
    
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error("Please log in to place an order");
      navigate("/login");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    if (!selectedPackage) {
      toast.error("Please select a package");
      return;
    }

    const orderId = await generateOrderNumber();
    setCurrentOrderId(orderId);
    setShowReviewModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!user || !selectedPackage) return;

    setIsSubmitting(true);
    try {
      await createOrder({
        order_number: currentOrderId,
        product_category: "other",
        product_name: "Roblox Robux",
        package_name: selectedPackage.name,
        quantity: selectedPackage.quantity,
        price: selectedPackage.price,
        product_details: {
          username: formData.username,
          password: formData.password,
          whatsapp: formData.whatsapp || "",
        },
      });

      setShowReviewModal(false);
      setShowSuccessModal(true);
      toast.success("Order placed successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTopUpAgain = () => {
    setShowSuccessModal(false);
    setFormData({ username: "", password: "", whatsapp: "" });
    setSelectedPackage(null);
    setCurrentOrderId("");
  };

  const getButtonText = () => {
    if (!formData.username || !formData.password) {
      return "Enter Details to Buy";
    }
    if (!selectedPackage) {
      return "Select Package to Buy";
    }
    return `Buy Now - ₹ ${selectedPackage.price}`;
  };

  const isFormValid = formData.username.length >= 3 && formData.password.length >= 6 && selectedPackage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      <RobloxProductHeader />
      
      <div className="container mx-auto px-4 py-6 pb-28">
        <div className="space-y-6">
          <RobloxUserInputForm
            formData={formData}
            onChange={handleInputChange}
            errors={errors}
          />
          
          <RobloxPackageSelector
            selectedPackage={selectedPackage}
            onSelectPackage={setSelectedPackage}
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-lg border-t border-border">
        <div className="container mx-auto">
          <Button
            onClick={handleBuyNow}
            disabled={!isFormValid}
            className="w-full h-16 text-lg font-bold rounded-2xl 
              bg-gradient-to-r from-destructive via-destructive to-destructive 
              hover:opacity-90 hover:shadow-[0_0_40px_rgba(220,38,38,0.6)] 
              hover:scale-[1.02] active:scale-[0.98] 
              transition-all duration-300 
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
              relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative z-10">{getButtonText()}</span>
          </Button>
        </div>
      </div>

      {user && profile && selectedPackage && (
        <RobloxOrderReview
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onConfirm={handleConfirmOrder}
          orderData={{
            orderId: currentOrderId,
            package: selectedPackage,
            username: formData.username,
            password: formData.password,
            whatsapp: formData.whatsapp,
            email: user.email!,
            currentBalance: profile.balance,
          }}
          isSubmitting={isSubmitting}
        />
      )}

      <RobloxSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderId={currentOrderId}
        onTopUpAgain={handleTopUpAgain}
      />
    </div>
  );
};

export default RobloxTopUp;
