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

interface MLSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  onTopUpAgain: () => void;
}

export const MLSuccessModal = ({ isOpen, onClose, orderId, onTopUpAgain }: MLSuccessModalProps) => {
  const navigate = useNavigate();

  const handleViewOrders = () => {
    onClose();
    navigate("/dashboard");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Order Placed Successfully!</DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Your Mobile Legends diamond order has been received
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Order ID:</span>
              <span className="font-mono text-slate-100">{orderId}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Status:</span>
              <span className="text-yellow-400">Pending Confirmation</span>
            </div>
          </div>

          <p className="text-sm text-slate-400 text-center">
            Your order will be processed by our admin team shortly.
            You'll receive your diamonds within 5-10 minutes after confirmation.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleViewOrders} className="w-full bg-blue-600 hover:bg-blue-700">
            View My Orders
          </Button>
          <Button onClick={onTopUpAgain} variant="outline" className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700">
            Top Up Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
