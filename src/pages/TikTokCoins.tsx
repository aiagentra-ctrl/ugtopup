import { useState } from "react";
import { TikTokProductHeader } from "@/components/tiktok/TikTokProductHeader";
import { TikTokUserInputForm, TikTokFormData } from "@/components/tiktok/TikTokUserInputForm";
import { TikTokPackageSelector } from "@/components/tiktok/TikTokPackageSelector";
import { TikTokOrderReview } from "@/components/tiktok/TikTokOrderReview";
import { TikTokSuccessModal } from "@/components/tiktok/TikTokSuccessModal";
import { TikTokPackage } from "@/data/tiktokPackages";
import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { createOrder, generateOrderNumber } from "@/lib/orderApi";

const TikTokCoins = () => {
  const [formData, setFormData] = useState<TikTokFormData | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<TikTokPackage | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalPrice = selectedPackage ? selectedPackage.price * purchaseQuantity : 0;
  const totalItems = selectedPackage ? selectedPackage.quantity * purchaseQuantity : 0;

  const handleFormDataChange = (data: TikTokFormData) => {
    setFormData(data);
    setIsFormValid(data.username.length >= 3 && data.password.length >= 6);
  };

  const handlePackageSelect = (pkg: TikTokPackage) => {
    setSelectedPackage(pkg);
    setPurchaseQuantity(1);
  };

  const handleReviewOrder = async () => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please log in to place an order", variant: "destructive" });
      navigate("/login");
      return;
    }
    if (!isFormValid || !selectedPackage) {
      toast({ title: "Invalid Details", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    const newOrderId = await generateOrderNumber();
    setOrderId(newOrderId);
    setIsReviewOpen(true);
  };

  const handleConfirmPurchase = async () => {
    if (!user || !selectedPackage || !formData || !profile) return;
    if (profile.balance < totalPrice) {
      toast({ title: "Insufficient Credits", description: "Please add credits to your account", variant: "destructive" });
      return;
    }
    try {
      await createOrder({
        order_number: orderId,
        product_category: 'tiktok',
        product_name: 'TikTok Coins',
        package_name: selectedPackage.name,
        quantity: totalItems,
        price: totalPrice,
        product_details: {
          username: formData.username,
          password: formData.password,
          whatsapp: formData.whatsapp || "",
          purchase_quantity: purchaseQuantity,
          unit_price: selectedPackage.price,
          unit_quantity: selectedPackage.quantity,
        }
      });
      await refreshProfile();
      setIsReviewOpen(false);
      setIsSuccessOpen(true);
      toast({ title: "Order Placed Successfully!", description: `Your order ${orderId} is pending confirmation`, className: "bg-dashboard-green/20 border-dashboard-green-bright" });
    } catch (error: any) {
      toast({ title: "Order Failed", description: error.message || "Failed to place order.", variant: "destructive" });
    }
  };

  const handleTopUpAgain = () => {
    setSelectedPackage(null);
    setFormData(null);
    setIsFormValid(false);
    setIsSuccessOpen(false);
    setPurchaseQuantity(1);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TikTokProductHeader />
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-6xl animate-fade-in">
        <section><TikTokUserInputForm onDataChange={handleFormDataChange} initialData={formData || undefined} /></section>
        <section><TikTokPackageSelector selectedPackage={selectedPackage} onSelectPackage={handlePackageSelect} /></section>
        {selectedPackage && (
          <section>
            <QuantitySelector value={purchaseQuantity} onChange={setPurchaseQuantity} min={1} max={10} unitPrice={selectedPackage.price} unitQuantity={selectedPackage.quantity} itemLabel="Coins" />
          </section>
        )}
        <div className="h-20"></div>
      </main>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-xl border-t border-border/40">
        <div className="container mx-auto max-w-6xl">
          <Button onClick={handleReviewOrder} disabled={!isFormValid || !selectedPackage} className="w-full h-16 text-lg sm:text-xl font-bold rounded-2xl bg-gradient-to-r from-destructive via-red-600 to-destructive hover:opacity-90 transition-all duration-300 disabled:opacity-40 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            <span className="relative z-10">{!isFormValid ? "Enter Details to Buy" : !selectedPackage ? "Select Package to Buy" : `Buy Now - ₹${totalPrice.toLocaleString()}`}</span>
          </Button>
        </div>
      </div>
      <TikTokOrderReview isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} onConfirm={handleConfirmPurchase} selectedPackage={selectedPackage} formData={formData} orderId={orderId} purchaseQuantity={purchaseQuantity} totalPrice={totalPrice} totalItems={totalItems} />
      <TikTokSuccessModal isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)} orderId={orderId} onTopUpAgain={handleTopUpAgain} />
    </div>
  );
};

export default TikTokCoins;
