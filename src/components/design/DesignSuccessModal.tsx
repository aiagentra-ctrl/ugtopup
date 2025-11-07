import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DesignSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onOrderAgain: () => void;
}

export const DesignSuccessModal = ({
  isOpen,
  onClose,
  orderId,
  onOrderAgain,
}: DesignSuccessModalProps) => {
  const navigate = useNavigate();

  const handleViewOrders = () => {
    onClose();
    navigate("/dashboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center animate-scale-in">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-slate-100">
            Order Placed Successfully!
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400 space-y-2">
            <p>Your design service order has been confirmed.</p>
            <p className="text-sm">We'll contact you shortly on WhatsApp to discuss your requirements.</p>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4 text-center">
            <p className="text-sm text-slate-400 mb-1">Order Reference Number</p>
            <p className="text-xl font-bold text-slate-100 font-mono">{orderId}</p>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-sm text-blue-300">
              💬 Our design team will reach out to you on WhatsApp within 24 hours to start working on your project.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onOrderAgain}
            className="flex-1 border-slate-700 hover:bg-slate-800"
          >
            Order Again
          </Button>
          <Button
            onClick={handleViewOrders}
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            View My Orders
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
