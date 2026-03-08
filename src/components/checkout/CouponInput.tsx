import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ticket, X, Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import { validateCoupon, getAvailableCoupons, CouponValidation } from "@/lib/couponApi";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface CouponInputProps {
  orderAmount: number;
  productCategory?: string;
  onCouponApplied: (result: CouponValidation & { code: string }) => void;
  onCouponRemoved: () => void;
  appliedCoupon: (CouponValidation & { code: string }) | null;
}

export const CouponInput = ({
  orderAmount,
  productCategory,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}: CouponInputProps) => {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      getAvailableCoupons().then(setSuggestions);
    }
  }, [user]);

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    const result = await validateCoupon(code.trim(), orderAmount, productCategory);

    if (result.valid) {
      onCouponApplied({ ...result, code: code.trim().toUpperCase() });
      setError("");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleSuggestionClick = async (couponCode: string) => {
    setCode(couponCode);
    setShowSuggestions(false);
    setLoading(true);
    setError("");

    const result = await validateCoupon(couponCode, orderAmount, productCategory);
    if (result.valid) {
      onCouponApplied({ ...result, code: couponCode });
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  if (appliedCoupon) {
    return (
      <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Check className="h-4 w-4 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-primary truncate">
              {appliedCoupon.code} applied
            </p>
            <p className="text-xs text-muted-foreground">
              You save ₹{appliedCoupon.discount_amount?.toLocaleString()}
            </p>
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onCouponRemoved} className="shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Enter coupon code"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
            className="pl-9 uppercase"
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
        </div>
        <Button onClick={handleApply} disabled={loading || !code.trim()} size="default" variant="outline">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {suggestions.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="text-xs text-primary flex items-center gap-1 hover:underline"
          >
            {showSuggestions ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {suggestions.length} coupon{suggestions.length > 1 ? "s" : ""} available
          </button>
          {showSuggestions && (
            <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSuggestionClick(s.code)}
                  className="w-full text-left p-2 rounded-md border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold">{s.code}</span>
                    <Badge variant="outline" className="text-xs">
                      {s.discount_type === "fixed" ? `₹${s.discount_value} OFF` : `${s.discount_value || s.discount_percent}% OFF`}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
