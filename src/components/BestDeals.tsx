import { useState, useEffect } from "react";
import { Zap, Flame, Clock, Tag, Gift } from "lucide-react";
import { useOffers } from "@/hooks/useOffers";
import { useNavigate } from "react-router-dom";

const calculateTimeLeft = (endDate: string) => {
  const diff = Math.max(0, Math.floor((new Date(endDate).getTime() - Date.now()) / 1000));
  return {
    days: Math.floor(diff / 86400),
    hours: Math.floor((diff % 86400) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
  };
};

const formatNumber = (num: number) => String(num).padStart(2, "0");

// Fallback: 7-day recurring timer
const SEVEN_DAYS = 7 * 86400;
const ANCHOR = new Date("2025-11-30T00:00:00Z").getTime();
const getFallbackTime = () => {
  const remaining = SEVEN_DAYS - (Math.floor((Date.now() - ANCHOR) / 1000) % SEVEN_DAYS);
  return {
    days: Math.floor(remaining / 86400),
    hours: Math.floor((remaining % 86400) / 3600),
    minutes: Math.floor((remaining % 3600) / 60),
    seconds: remaining % 60,
  };
};

const offerIcons: Record<string, any> = {
  flash_sale: Zap,
  limited_time: Clock,
  daily_deal: Tag,
  discount_bundle: Gift,
};

function OfferTimer({ offer }: { offer: any }) {
  const [time, setTime] = useState(
    offer.timer_end_date ? calculateTimeLeft(offer.timer_end_date) : getFallbackTime()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(offer.timer_end_date ? calculateTimeLeft(offer.timer_end_date) : getFallbackTime());
    }, 1000);
    return () => clearInterval(timer);
  }, [offer.timer_end_date]);

  const showDays = offer.timer_type === "days" || offer.timer_type === "both" || !offer.timer_type;
  const showHours = offer.timer_type === "hours" || offer.timer_type === "both" || !offer.timer_type;

  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 text-xl md:text-3xl font-semibold text-foreground/90" role="status" aria-live="polite">
      {showDays && <><span className="tabular-nums">{formatNumber(time.days)}D</span><span className="text-muted-foreground">:</span></>}
      {showHours && <><span className="tabular-nums">{formatNumber(time.hours)}H</span><span className="text-muted-foreground">:</span></>}
      <span className="tabular-nums">{formatNumber(time.minutes)}M</span>
      <span className="text-muted-foreground">:</span>
      <span className="tabular-nums">{formatNumber(time.seconds)}S</span>
    </div>
  );
}

export const BestDeals = () => {
  const { offers, loading } = useOffers("homepage");
  const navigate = useNavigate();

  // Fallback to original "BEST DEALS" if no offers configured
  if (!loading && offers.length === 0) {
    return <FallbackBestDeals />;
  }

  if (loading) return null;

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4 space-y-10">
        {offers.map((offer) => {
          const Icon = offerIcons[offer.offer_type] || Zap;
          return (
            <div
              key={offer.id}
              className="flex flex-col items-center justify-center space-y-6 text-center cursor-pointer"
              onClick={() => offer.product_link && navigate(offer.product_link)}
            >
              <h2 className="flex items-center justify-center gap-3 text-2xl md:text-4xl font-bold tracking-wider">
                <Icon className="w-7 h-7 md:w-10 md:h-10 text-yellow-400 fill-yellow-400" />
                <span className="text-primary uppercase" style={{ letterSpacing: "0.1em" }}>
                  {offer.title}
                </span>
                <Flame className="w-7 h-7 md:w-10 md:h-10 text-orange-500 fill-orange-500" />
              </h2>
              {offer.subtitle && <p className="text-muted-foreground text-sm md:text-base">{offer.subtitle}</p>}
              {offer.image_url && <img src={offer.image_url} alt={offer.title} className="max-h-40 rounded-xl object-cover" />}
              {offer.timer_enabled && <OfferTimer offer={offer} />}
              {offer.description && <p className="text-foreground/80 max-w-xl">{offer.description}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
};

// Original hardcoded fallback
function FallbackBestDeals() {
  const [time, setTime] = useState(getFallbackTime());
  useEffect(() => {
    const t = setInterval(() => setTime(getFallbackTime()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          <h2 className="flex items-center justify-center gap-3 text-2xl md:text-4xl font-bold tracking-wider">
            <Zap className="w-7 h-7 md:w-10 md:h-10 text-yellow-400 fill-yellow-400" />
            <span className="text-primary uppercase" style={{ letterSpacing: "0.1em" }}>BEST DEALS</span>
            <Flame className="w-7 h-7 md:w-10 md:h-10 text-orange-500 fill-orange-500" />
          </h2>
          <div className="flex items-center justify-center gap-2 md:gap-4 text-xl md:text-3xl font-semibold text-foreground/90">
            <span className="tabular-nums">{formatNumber(time.days)}D</span><span className="text-muted-foreground">:</span>
            <span className="tabular-nums">{formatNumber(time.hours)}H</span><span className="text-muted-foreground">:</span>
            <span className="tabular-nums">{formatNumber(time.minutes)}M</span><span className="text-muted-foreground">:</span>
            <span className="tabular-nums">{formatNumber(time.seconds)}S</span>
          </div>
        </div>
      </div>
    </section>
  );
}
