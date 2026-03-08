import { useNavigate } from "react-router-dom";
import { Offer } from "@/hooks/useOffers";
import { cn } from "@/lib/utils";

const themeStyles: Record<string, { bg: string; border: string; accent: string }> = {
  holi: { bg: "linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3)", border: "border-pink-400", accent: "text-pink-300" },
  diwali: { bg: "linear-gradient(135deg, #f7971e, #ffd200, #ff6b6b)", border: "border-yellow-400", accent: "text-yellow-300" },
  christmas: { bg: "linear-gradient(135deg, #c62828, #2e7d32, #c62828)", border: "border-red-400", accent: "text-green-300" },
  new_year: { bg: "linear-gradient(135deg, #1a1a2e, #16213e, #e94560)", border: "border-purple-400", accent: "text-purple-300" },
};

export function OfferSeasonal({ offer }: { offer: Offer }) {
  const navigate = useNavigate();
  const theme = themeStyles[offer.seasonal_theme || ""] || themeStyles.diwali;

  return (
    <div
      className={cn("rounded-2xl overflow-hidden cursor-pointer border-2 transition-transform hover:scale-[1.01]", theme.border)}
      style={{ background: offer.background_gradient || theme.bg }}
      onClick={() => offer.product_link && navigate(offer.product_link)}
    >
      <div className="relative p-6 sm:p-8 text-center">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10">
          <span className={cn("text-xs font-bold uppercase tracking-[0.2em]", theme.accent)}>
            {offer.seasonal_theme?.replace("_", " ") || "Festival"} Special
          </span>
          <h3 className="text-2xl sm:text-4xl font-bold text-white mt-2 mb-2">{offer.title}</h3>
          {offer.subtitle && <p className="text-white/80 text-sm sm:text-lg">{offer.subtitle}</p>}
          {offer.image_url && (
            <img src={offer.image_url} alt={offer.title} className="mx-auto mt-4 h-24 sm:h-32 rounded-xl object-cover shadow-xl" />
          )}
          {offer.description && <p className="text-white/70 text-sm mt-4 max-w-lg mx-auto">{offer.description}</p>}
          {offer.badge_text && (
            <span
              className="inline-block mt-4 px-4 py-1.5 rounded-full text-sm font-bold animate-pulse"
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
