import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Offer } from "@/hooks/useOffers";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

const SEVEN_DAYS = 7 * 86400;
const ANCHOR = new Date("2025-11-30T00:00:00Z").getTime();

function getTimeLeft(endDate: string | null) {
  if (endDate) {
    const diff = Math.max(0, Math.floor((new Date(endDate).getTime() - Date.now()) / 1000));
    return { d: Math.floor(diff / 86400), h: Math.floor((diff % 86400) / 3600), m: Math.floor((diff % 3600) / 60), s: diff % 60 };
  }
  const remaining = SEVEN_DAYS - (Math.floor((Date.now() - ANCHOR) / 1000) % SEVEN_DAYS);
  return { d: Math.floor(remaining / 86400), h: Math.floor((remaining % 86400) / 3600), m: Math.floor((remaining % 3600) / 60), s: remaining % 60 };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function OfferDailyDeal({ offer }: { offer: Offer }) {
  const navigate = useNavigate();
  const [time, setTime] = useState(getTimeLeft(offer.timer_end_date));

  useEffect(() => {
    const t = setInterval(() => setTime(getTimeLeft(offer.timer_end_date)), 1000);
    return () => clearInterval(t);
  }, [offer.timer_end_date]);

  return (
    <div
      className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:p-6 cursor-pointer hover:border-destructive/50 transition-colors"
      onClick={() => offer.product_link && navigate(offer.product_link)}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {offer.image_url && (
          <img src={offer.image_url} alt={offer.title} className="h-20 w-20 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <Clock className="h-4 w-4 text-destructive animate-pulse" />
            <span className="text-destructive text-xs font-bold uppercase tracking-wider">Daily Deal</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-foreground">{offer.title}</h3>
          {offer.subtitle && <p className="text-muted-foreground text-sm">{offer.subtitle}</p>}
        </div>
        <div className="flex items-center gap-1.5 text-center">
          {[
            { label: "D", value: time.d },
            { label: "H", value: time.h },
            { label: "M", value: time.m },
            { label: "S", value: time.s },
          ].map((u) => (
            <div key={u.label} className="bg-destructive/10 border border-destructive/20 rounded-lg px-2 py-1.5 min-w-[40px]">
              <div className="text-lg sm:text-xl font-bold text-destructive tabular-nums">{pad(u.value)}</div>
              <div className="text-[9px] text-muted-foreground font-medium">{u.label}</div>
            </div>
          ))}
        </div>
      </div>
      {offer.description && <p className="text-muted-foreground text-sm mt-3 text-center sm:text-left">{offer.description}</p>}
    </div>
  );
}
