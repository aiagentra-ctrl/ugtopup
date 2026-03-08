import { useNavigate } from "react-router-dom";
import { Offer } from "@/hooks/useOffers";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfferHighlight({ offer }: { offer: Offer }) {
  const navigate = useNavigate();

  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: offer.background_gradient || "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
      onClick={() => offer.product_link && navigate(offer.product_link)}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-8 p-6 sm:p-10">
        {offer.image_url && (
          <img src={offer.image_url} alt={offer.title} className="h-28 sm:h-40 w-28 sm:w-40 rounded-xl object-cover shadow-2xl group-hover:scale-105 transition-transform" />
        )}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span className="text-yellow-300 text-xs font-bold uppercase tracking-widest">Featured Offer</span>
          </div>
          <h3 className="text-2xl sm:text-4xl font-bold text-white mb-2">{offer.title}</h3>
          {offer.subtitle && <p className="text-white/80 text-sm sm:text-lg mb-3">{offer.subtitle}</p>}
          {offer.description && <p className="text-white/70 text-sm max-w-md mb-4">{offer.description}</p>}
          <Button variant="secondary" size="lg" className="font-bold">
            Shop Now
          </Button>
        </div>
      </div>
    </div>
  );
}
