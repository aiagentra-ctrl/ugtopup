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

const FreefireDiamond = () => {
  const [formData, setFormData] = useState<UserFormData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFormDataChange = (data: UserFormData) => {
    setFormData(data);
    setIsFormValid(data.uid.length >= 6 && /^\d+$/.test(data.uid));
  };

  const handleReviewOrder = () => {
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
        title: "Invalid UID",
        description: "Please enter a valid UID (minimum 6 digits)",
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

    const newOrderId = `FF-${Date.now()}`;
    setOrderId(newOrderId);
    setIsReviewOpen(true);
  };

  const handleConfirmPurchase = () => {
    if (!user || !selectedPackage || !formData) return;

    // Check sufficient balance
    if ((user.balance || 0) < selectedPackage.price) {
      toast({
        title: "Insufficient Credits",
        description: "Please add credits to your account",
        variant: "destructive",
      });
      return;
    }

    // Create order object
    const order = {
      orderId,
      product: "Free Fire Diamond",
      package: selectedPackage.name,
      quantity: selectedPackage.quantity,
      price: selectedPackage.price,
      currency: selectedPackage.currency,
      uid: formData.uid,
      username: formData.username || "Not provided",
      zoneId: formData.zoneId || "Not provided",
      paymentMethod: "Credit",
      email: user.email,
      timestamp: new Date().toISOString(),
      status: "completed",
    };

    // Store order in localStorage (temporary - will integrate with backend later)
    const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    localStorage.setItem('orders', JSON.stringify([...existingOrders, order]));

    // Deduct credits from user balance
    const updatedUser = {
      ...user,
      balance: (user.balance || 0) - selectedPackage.price,
      orders: (user.orders || 0) + 1,
    };
    localStorage.setItem('tempUser', JSON.stringify(updatedUser));

    // Update user context (trigger re-render)
    window.dispatchEvent(new Event('storage'));

    // Close review, show success
    setIsReviewOpen(false);
    setIsSuccessOpen(true);

    toast({
      title: "Order Placed Successfully!",
      description: `Your order ${orderId} has been confirmed`,
      className: "bg-dashboard-green/20 border-dashboard-green-bright",
    });
  };

  const handleTopUpAgain = () => {
    setSelectedPackage(null);
    setFormData(null);
    setIsFormValid(false);
    setIsSuccessOpen(false);
  };

  const canReviewOrder = isFormValid && selectedPackage !== null;

  return (
    <div className="min-h-screen bg-background">
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

        {/* Review Order Button - Sticky on Mobile */}
        <div className="sticky bottom-4 z-40">
          <Button
            onClick={handleReviewOrder}
            disabled={!canReviewOrder}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90 glow-border disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isFormValid
              ? "Enter UID to Continue"
              : !selectedPackage
              ? "Select a Package"
              : "Review Order"}
          </Button>
        </div>
      </main>

      {/* Order Review Modal */}
      <OrderReview
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onConfirm={handleConfirmPurchase}
        selectedPackage={selectedPackage}
        formData={formData}
        orderId={orderId}
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
