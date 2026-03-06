import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { getOrderStatus } from '@/utils/chatApi';
import { format } from 'date-fns';

interface OrderTrackerProps {
  prompt: string;
  onResult: (text: string) => void;
}

export const OrderTracker = ({ prompt, onResult }: OrderTrackerProps) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const res = await getOrderStatus(query);

      if (!res.orders || res.orders.length === 0) {
        onResult(`❌ No orders found for "${query.trim()}". Please check your Order ID or email and try again.`);
        return;
      }

      const results = res.orders.map((order) => {
        const statusIcon: Record<string, string> = {
          pending: '⏳', confirmed: '✅', completed: '🎉', canceled: '❌', processing: '⚙️',
        };

        let result = `${statusIcon[order.status] || '📦'} **Order: ${order.order_number}**\n`;
        result += `📦 Product: ${order.product} - ${order.package}\n`;
        result += `💰 Price: Rs.${order.price}\n`;
        result += `📅 Date: ${format(new Date(order.created_at), 'MMM dd, yyyy h:mm a')}\n`;
        result += `📊 Status: **${order.status.toUpperCase()}**`;

        if (order.confirmed_at) result += `\n✅ Confirmed: ${format(new Date(order.confirmed_at), 'MMM dd, h:mm a')}`;
        if (order.completed_at) result += `\n🎉 Completed: ${format(new Date(order.completed_at), 'MMM dd, h:mm a')}`;
        if (order.canceled_at) result += `\n❌ Canceled: ${format(new Date(order.canceled_at), 'MMM dd, h:mm a')}`;
        if (order.cancellation_reason) result += `\n📝 Reason: ${order.cancellation_reason}`;

        return result;
      });

      onResult(results.join('\n\n---\n\n'));
    } catch (err: any) {
      onResult(`❌ Error looking up order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <p className="text-xs text-muted-foreground">{prompt}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Order ID or email..."
          className="flex-1 px-3 py-2 text-sm rounded-lg bg-input border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          style={{ fontSize: '16px' }}
          disabled={loading}
        />
        <button
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className="px-3 py-2 rounded-lg bg-gradient-to-br from-primary to-secondary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
};
