import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DesignProductHeader } from "@/components/design/DesignProductHeader";
import { DesignContactForm } from "@/components/design/DesignContactForm";
import { DesignPackageDisplay } from "@/components/design/DesignPackageDisplay";
import { DesignOrderReview } from "@/components/design/DesignOrderReview";
import { DesignSuccessModal } from "@/components/design/DesignSuccessModal";
import { thumbnailDesignPackage } from "@/data/designPackages";
import { Button } from "@/components/ui/button";
import { createOrder, generateOrderNumber } from "@/lib/orderApi";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const ThumbnailDesign = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: "",
    whatsapp: "",
  });
  
  const [errors, setErrors] = useState<{ email?: string; whatsapp?: string }>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: { email?: string; whatsapp?: string } = {};
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.whatsapp || formData.whatsapp.length < 10) {
      newErrors.whatsapp = "Please enter a valid WhatsApp number (min 10 digits)";
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

    const orderId = await generateOrderNumber();
    setCurrentOrderId(orderId);
    setShowReviewModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await createOrder({
        order_number: currentOrderId,
        product_category: "design",
        product_name: "Thumbnail Design",
        package_name: thumbnailDesignPackage.name,
        quantity: 1,
        price: thumbnailDesignPackage.price,
        product_details: {
          email: formData.email,
          whatsapp: formData.whatsapp,
          designType: "thumbnail",
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

  const handleOrderAgain = () => {
    setShowSuccessModal(false);
    setFormData({ email: "", whatsapp: "" });
    setCurrentOrderId("");
  };

  const isFormValid = formData.email && formData.whatsapp.length >= 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <DesignProductHeader 
        title="Thumbnail Design Service"
        subtitle="YouTube Thumbnails"
        icon={thumbnailDesignPackage.icon}
      />
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        <DesignContactForm
          formData={formData}
          onChange={handleInputChange}
          errors={errors}
        />
        
        <DesignPackageDisplay package={thumbnailDesignPackage} />
      </div>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-lg border-t border-slate-800">
        <div className="container mx-auto">
          <Button
            onClick={handleBuyNow}
            disabled={!isFormValid}
            className="w-full h-16 text-lg font-bold rounded-2xl 
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
                ? "Enter Details to Order"
                : `Order Now - ₹${thumbnailDesignPackage.price}`}
            </span>
          </Button>
        </div>
      </div>

      {/* Modals */}
      {user && profile && (
        <DesignOrderReview
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onConfirm={handleConfirmOrder}
          orderData={{
            orderId: currentOrderId,
            package: thumbnailDesignPackage,
            email: formData.email,
            whatsapp: formData.whatsapp,
            userEmail: user.email!,
            currentBalance: profile.balance,
          }}
          isSubmitting={isSubmitting}
        />
      )}

      <DesignSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderId={currentOrderId}
        onOrderAgain={handleOrderAgain}
      />
    </div>
  );
};

export default ThumbnailDesign;
