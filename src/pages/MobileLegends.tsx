import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { MLProductHeader } from "@/components/ml/MLProductHeader";
import { MLUserInputForm } from "@/components/ml/MLUserInputForm";
import { MLPackageSelector, type MLPackage } from "@/components/ml/MLPackageSelector";

// Non-API packages that go through normal order management (no Liana API)
const NON_API_PACKAGES = new Set(['55 Diamonds', '110 Diamonds', '165 Diamonds', '275 Diamonds', '565 Diamonds']);
import { MLOrderReview } from "@/components/ml/MLOrderReview";
import { MLSuccessModal } from "@/components/ml/MLSuccessModal";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { createOrder, generateOrderNumber } from "@/lib/orderApi";
import { ensureSufficientBalance } from "@/lib/creditApi";
import { requestDeduplicator } from "@/lib/requestDeduplicator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const MobileLegends = () => {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    userId: "",
    zoneId: "",
    whatsapp: "",
  });
  
  const [errors, setErrors] = useState<{ userId?: string; zoneId?: string }>({});
  const [selectedPackage, setSelectedPackage] = useState<MLPackage | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");

  const totalPrice = selectedPackage ? selectedPackage.price * purchaseQuantity : 0;
  const totalItems = selectedPackage ? selectedPackage.quantity * purchaseQuantity : 0;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePackageSelect = (pkg: MLPackage) => {
    setSelectedPackage(pkg);
    setPurchaseQuantity(1);
  };

  const validateForm = (): boolean => {
    const newErrors: { userId?: string; zoneId?: string } = {};
    
    if (!formData.userId || formData.userId.trim() === "") {
      newErrors.userId = "User ID is required";
    }
    
    if (!formData.zoneId || formData.zoneId.trim() === "") {
      newErrors.zoneId = "Zone ID is required";
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

    // Check balance from DB before opening review
    const { ok, balance } = await ensureSufficientBalance(totalPrice);
    if (!ok) {
      toast.error(`Insufficient credits. You have ₹${balance}, but need ₹${totalPrice}. Please top up.`);
      return;
    }

    const orderId = await generateOrderNumber();
    setCurrentOrderId(orderId);
    setShowReviewModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!user || !selectedPackage || isPlacingOrder) return;

    setIsPlacingOrder(true);
    setIsSubmitting(true);
    
    try {
      // Step 1: Create the order (deducts credits)
      const order = await requestDeduplicator.dedupe(
        `place_order:${user.id}:${selectedPackage.name}:${purchaseQuantity}`,
        async () => {
          return await createOrder({
            order_number: currentOrderId,
            product_category: "mobile_legends",
            product_name: "Mobile Legends Diamond",
            package_name: selectedPackage.name,
            quantity: totalItems,
            price: totalPrice,
            product_details: {
              userId: formData.userId,
              zoneId: formData.zoneId,
              whatsapp: formData.whatsapp || "",
              packageType: selectedPackage.type,
              purchase_quantity: purchaseQuantity,
              unit_price: selectedPackage.price,
              unit_quantity: selectedPackage.quantity,
            },
          });
        }
      );

      // Step 2: Check if this is an API package or non-API package
      const isApiPackage = !NON_API_PACKAGES.has(selectedPackage.name);

      if (isApiPackage) {
        // Automatically process via Liana API
        toast.info("Processing your order...");
        
        const { data: apiResult, error: apiError } = await supabase.functions.invoke('process-ml-order', {
          body: { order_id: order.id }
        });

        await refreshProfile();
        setShowReviewModal(false);

        if (apiError) {
          console.error('Liana API error:', apiError);
          setShowSuccessModal(true);
          toast.warning("Order placed but processing encountered an issue. Our team will review it.");
        } else if (apiResult?.success) {
          setShowSuccessModal(true);
          toast.success(`Diamonds delivered successfully!${apiResult.ign ? ` (IGN: ${apiResult.ign})` : ''}`);
        } else {
          setShowSuccessModal(true);
          toast.warning(`Order placed. ${apiResult?.error || 'Processing in progress...'}`);
        }
      } else {
        // Non-API package - goes through normal order management
        await refreshProfile();
        setShowReviewModal(false);
        setShowSuccessModal(true);
        toast.success("Order placed successfully! Our team will process it shortly.");
      }
    } catch (error: any) {
      await refreshProfile();
      toast.error(error.message || "Failed to place order");
    } finally {
      setIsSubmitting(false);
      setIsPlacingOrder(false);
    }
  };

  const handleTopUpAgain = () => {
    setShowSuccessModal(false);
    setFormData({ userId: "", zoneId: "", whatsapp: "" });
    setSelectedPackage(null);
    setCurrentOrderId("");
    setPurchaseQuantity(1);
  };

  const getButtonText = () => {
    if (isPlacingOrder) {
      return "Processing...";
    }
    if (!formData.userId || formData.userId.trim() === "") {
      return "Enter User ID";
    }
    if (!formData.zoneId || formData.zoneId.trim() === "") {
      return "Enter Zone ID";
    }
    if (!selectedPackage) {
      return "Select Package First";
    }
    return `Buy Now - ₹${totalPrice.toLocaleString()}`;
  };

  const isFormValid = formData.userId.trim() !== "" && formData.zoneId.trim() !== "" && selectedPackage && !isPlacingOrder;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background">
      <MLProductHeader />
      
      <div className="container mx-auto px-4 py-6 pb-28">
        <div className="space-y-6">
          <MLUserInputForm
            formData={formData}
            onChange={handleInputChange}
            errors={errors}
          />
          
          <MLPackageSelector
            selectedPackage={selectedPackage}
            onSelectPackage={handlePackageSelect}
          />

          {selectedPackage && (
            <QuantitySelector
              value={purchaseQuantity}
              onChange={setPurchaseQuantity}
              min={1}
              max={10}
              unitPrice={selectedPackage.price}
              unitQuantity={selectedPackage.quantity}
              itemLabel="Diamonds"
            />
          )}
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

      {user && selectedPackage && (
        <MLOrderReview
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onConfirm={handleConfirmOrder}
          orderData={{
            orderId: currentOrderId,
            package: selectedPackage,
            userId: formData.userId,
            zoneId: formData.zoneId,
            whatsapp: formData.whatsapp,
            email: user.email!,
          }}
          isPlacingOrder={isPlacingOrder}
          purchaseQuantity={purchaseQuantity}
          totalPrice={totalPrice}
          totalItems={totalItems}
        />
      )}

      <MLSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderId={currentOrderId}
        onTopUpAgain={handleTopUpAgain}
      />
    </div>
  );
};

export default MobileLegends;
