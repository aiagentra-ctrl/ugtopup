import { Order } from "@/lib/orderApi";
import { format } from "date-fns";
import { Check, Clock, XCircle, Package, Truck, CheckCircle2 } from "lucide-react";

interface OrderTimelineProps {
  order: Order;
}

interface TimelineStep {
  label: string;
  timestamp: string | null;
  icon: React.ElementType;
  status: 'completed' | 'current' | 'upcoming' | 'canceled';
}

export const OrderTimeline = ({ order }: OrderTimelineProps) => {
  const isCanceled = order.status === 'canceled';

  const steps: TimelineStep[] = [
    {
      label: 'Order Placed',
      timestamp: order.created_at,
      icon: Package,
      status: 'completed',
    },
    {
      label: 'Processing',
      timestamp: (order as any).processing_started_at || null,
      icon: Clock,
      status: isCanceled
        ? 'upcoming'
        : (order as any).processing_started_at
          ? 'completed'
          : order.status === 'pending'
            ? 'current'
            : 'upcoming',
    },
    {
      label: 'Confirmed',
      timestamp: (order as any).confirmed_at || null,
      icon: Truck,
      status: isCanceled
        ? 'upcoming'
        : (order as any).confirmed_at
          ? 'completed'
          : order.status === 'confirmed'
            ? 'current'
            : 'upcoming',
    },
    {
      label: 'Completed',
      timestamp: (order as any).completed_at || null,
      icon: CheckCircle2,
      status: isCanceled
        ? 'upcoming'
        : (order as any).completed_at
          ? 'completed'
          : order.status === 'completed'
            ? 'completed'
            : 'upcoming',
    },
  ];

  if (isCanceled) {
    steps.push({
      label: 'Canceled',
      timestamp: (order as any).canceled_at || null,
      icon: XCircle,
      status: 'canceled',
    });
  }

  const getStepColor = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'current': return 'bg-yellow-500 text-white animate-pulse';
      case 'canceled': return 'bg-destructive text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getLineColor = (status: TimelineStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'canceled': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-start justify-between overflow-x-auto gap-0">
        {steps.map((step, index) => (
          <div key={step.label} className="flex flex-col items-center flex-1 min-w-[80px] relative">
            {/* Connector line */}
            {index > 0 && (
              <div className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${getLineColor(step.status)}`} />
            )}
            {/* Icon circle */}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${getStepColor(step.status)}`}>
              <step.icon className="h-4 w-4" />
            </div>
            {/* Label */}
            <span className="text-xs font-medium text-foreground mt-2 text-center">{step.label}</span>
            {/* Timestamp */}
            {step.timestamp && (
              <span className="text-[10px] text-muted-foreground mt-0.5 text-center">
                {format(new Date(step.timestamp), 'MMM dd, HH:mm')}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* Cancellation reason */}
      {isCanceled && (order as any).cancellation_reason && (
        <p className="text-xs text-destructive mt-3 text-center">
          Reason: {(order as any).cancellation_reason}
        </p>
      )}
    </div>
  );
};
