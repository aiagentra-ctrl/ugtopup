import { useNavigate } from "react-router-dom";
import { Offer } from "@/hooks/useOffers";
import { cn } from "@/lib/utils";

const animationClasses: Record<string, string> = {
  none: "",
  pulse: "animate-pulse",
  flash: "animate-flash",
  bounce: "animate-bounce-subtle",
  "slide-in": "animate-slide-in-left",
};

export function OfferBanner({ offer }: { offer: Offer }) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "w-full rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.01]",
        animationClasses[offer.animation_type || "slide-in"]
      )}
      style={{
        background: offer.background_gradient || "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))",
      }}
      onClick={() => offer.product_link && navigate(offer.product_link)}
    >
      <div className="flex items-center gap-4 p-4 sm:p-6">
        {offer.image_url && (
          <img src={offer.image_url} alt={offer.title} className="h-16 sm:h-24 w-16 sm:w-24 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-2xl font-bold text-white truncate">{offer.title}</h3>
          {offer.subtitle && <p className="text-white/80 text-sm sm:text-base mt-1">{offer.subtitle}</p>}
          {offer.badge_text && (
            <span
              className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: offer.badge_color || "#ef4444", color: offer.badge_text_color || "#fff" }}
            >
              {offer.badge_text}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
