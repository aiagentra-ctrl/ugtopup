import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Upload, Loader2, CreditCard, QrCode, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import qrCode from "@/assets/ug-gaming-topup-qr.jpg";
import { submitPaymentRequest } from "@/lib/creditApi";
import { initiatePayment } from "@/lib/paymentApi";
import { cn } from "@/lib/utils";

interface TopUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type PaymentMethod = 'select' | 'online' | 'manual';

export const TopUpModal = ({ open, onOpenChange, onSuccess }: TopUpModalProps) => {
  const { user, profile } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('select');
  const [amount, setAmount] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        toast.error("File size must be less than 3MB");
        return;
      }
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error("Only PNG and JPG files are allowed");
        return;
      }
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleDownloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = 'ug-gaming-payment-qr.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code downloaded");
  };

  const handleOnlinePayment = async () => {
    const amountNum = parseFloat(amount);
    
    if (!amount || amountNum < 1) {
      toast.error("Please enter a valid amount (minimum Rs.1)");
      return;
    }

    if (amountNum > 100000) {
      toast.error("Maximum amount is Rs.100,000");
      return;
    }

    if (!user || !profile) {
      toast.error("Please log in to make a payment");
      return;
    }

    setLoading(true);

    try {
      const result = await initiatePayment(amountNum);

      if (result.success && result.redirect_url) {
        toast.success("Redirecting to payment gateway...");
        // Redirect to API Nepal checkout
        window.location.href = result.redirect_url;
      } else {
        toast.error(result.error || "Failed to initiate payment");
      }
    } catch (error: any) {
      console.error('Online payment error:', error);
      toast.error(error.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    
    if (!amount || amountNum < 1) {
      toast.error("Please enter a valid amount (minimum Rs.1)");
      return;
    }

    if (amountNum > 100000) {
      toast.error("Maximum amount is Rs.100,000");
      return;
    }
    
    if (!screenshot) {
      toast.error("Please upload a payment screenshot");
      return;
    }

    if (!user || !profile) {
      toast.error("Please log in to submit a request");
      return;
    }

    setLoading(true);

    try {
      const result = await submitPaymentRequest(
        amountNum,
        amountNum,
        remarks,
        screenshot
      );

      if (result.success) {
        toast.success(result.message);
        resetForm();
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.message || "Failed to submit credit request");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setScreenshot(null);
    setRemarks("");
    setPreviewUrl(null);
    setPaymentMethod('select');
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  // Payment method selection screen
  const renderMethodSelection = () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground text-center">
        Choose how you'd like to add credits
      </p>
      
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setPaymentMethod('online')}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            "hover:border-primary hover:bg-primary/5",
            "border-border bg-card"
          )}
        >
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Pay Online</p>
            <p className="text-xs text-muted-foreground mt-1">
              eSewa, Khalti, FonePay & more
            </p>
          </div>
          <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full">
            Instant Credit
          </span>
        </button>

        <button
          onClick={() => setPaymentMethod('manual')}
          className={cn(
            "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
            "hover:border-primary hover:bg-primary/5",
            "border-border bg-card"
          )}
        >
          <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center">
            <QrCode className="w-7 h-7 text-orange-500" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-foreground">Manual Payment</p>
            <p className="text-xs text-muted-foreground mt-1">
              Scan QR & upload screenshot
            </p>
          </div>
          <span className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded-full">
            Admin Verified
          </span>
        </button>
      </div>
    </div>
  );

  // Online payment form
  const renderOnlinePayment = () => (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setPaymentMethod('select')}
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center">
        <CreditCard className="w-10 h-10 mx-auto text-primary mb-2" />
        <p className="text-sm font-medium text-foreground">Online Payment</p>
        <p className="text-xs text-muted-foreground">
          Pay securely with eSewa, Khalti, FonePay, and more
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="online-amount" className="text-sm font-medium">
          Credits to Top-Up
        </Label>
        <Input
          id="online-amount"
          type="number"
          min="1"
          max="100000"
          step="1"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="bg-background/50 border-border focus:border-primary"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Rs.1 = 1 Credit</p>
          {amount && parseFloat(amount) > 0 && (
            <p className="text-sm font-semibold text-primary animate-fade-in">
              ₹{amount} = {amount} Credits
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          onClick={handleOnlinePayment}
          disabled={loading || !amount || parseFloat(amount) < 1}
          className="flex-1 bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Pay Now
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Manual payment form (existing flow)
  const renderManualPayment = () => (
    <form onSubmit={handleManualSubmit} className="space-y-6">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setPaymentMethod('select')}
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      {/* QR Code Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-muted-foreground">
          Scan to Pay
        </Label>
        <div className="topup-qr-container">
          <img 
            src={qrCode} 
            alt="Payment QR Code" 
            className="w-48 h-48 object-contain"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleDownloadQR}
        >
          <Download className="w-4 h-4 mr-2" />
          Download QR Code
        </Button>
        <p className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
          Add your Name <span className="font-semibold text-foreground">({profile?.username || profile?.full_name || user?.email?.split('@')[0] || 'Your Name'})</span> on the remarks registered on the website of payment
        </p>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="manual-amount" className="text-sm font-medium">
          Credits to Top-Up
        </Label>
        <Input
          id="manual-amount"
          type="number"
          min="1"
          max="100000"
          step="1"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="bg-background/50 border-border focus:border-primary"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Rs.1 = 1 Credit</p>
          {amount && parseFloat(amount) > 0 && (
            <p className="text-sm font-semibold text-primary animate-fade-in">
              ₹{amount} = {amount} Credits
            </p>
          )}
        </div>
      </div>

      {/* Screenshot Upload */}
      <div className="space-y-2">
        <Label htmlFor="screenshot" className="text-sm font-medium">
          Payment Screenshot
        </Label>
        <div className="topup-file-upload p-4 text-center cursor-pointer">
          <input
            id="screenshot"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            className="hidden"
            required
          />
          <label htmlFor="screenshot" className="cursor-pointer block">
            {previewUrl ? (
              <div className="space-y-2">
                <img src={previewUrl} alt="Preview" className="max-h-32 mx-auto rounded" />
                <p className="text-xs text-muted-foreground">{screenshot?.name}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PNG or JPG (max 3MB)</p>
              </div>
            )}
          </label>
        </div>
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks" className="text-sm font-medium">
          Additional Notes (Optional)
        </Label>
        <Textarea
          id="remarks"
          placeholder="Any additional information..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          className="bg-background/50 border-border focus:border-primary min-h-20"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="flex-1 topup-submit-button"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Credit"
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="topup-modal-content max-w-[500px] bg-gradient-to-b from-card to-card/95 border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {paymentMethod === 'select' && "Add Credits"}
            {paymentMethod === 'online' && "Online Payment"}
            {paymentMethod === 'manual' && "Manual Payment"}
          </DialogTitle>
        </DialogHeader>

        {paymentMethod === 'select' && renderMethodSelection()}
        {paymentMethod === 'online' && renderOnlinePayment()}
        {paymentMethod === 'manual' && renderManualPayment()}
      </DialogContent>
    </Dialog>
  );
};
