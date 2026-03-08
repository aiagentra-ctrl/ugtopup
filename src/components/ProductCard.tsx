import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { OfferBadge } from "@/components/offers/OfferBadge";

interface ProductCardProps {
  image: string;
  title: string;
  link?: string;
  onBuyNow?: () => void;
  badgeText?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  badgeAnimation?: string;
}

const placeholderColors = [
  "hsl(var(--primary))",
  "hsl(262 80% 50%)",
  "hsl(340 75% 50%)",
  "hsl(200 80% 45%)",
  "hsl(160 60% 40%)",
  "hsl(30 85% 50%)",
];

export const ProductCard = ({ image, title, link, badgeText, badgeColor, badgeTextColor, badgeAnimation }: ProductCardProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const placeholderBg = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
    return placeholderColors[Math.abs(hash) % placeholderColors.length];
  }, [title]);

  const initial = title.charAt(0).toUpperCase();

  const CardContent = (
    <div className="group cursor-pointer">
      <div className="overflow-hidden rounded-xl bg-card border border-border transition-all duration-300 ease-out hover:border-muted-foreground/30 hover:shadow-xl hover:shadow-background/50 hover:-translate-y-1 relative">
        <div className="aspect-square overflow-hidden relative">
          {badgeText && (
            <OfferBadge text={badgeText} color={badgeColor} textColor={badgeTextColor} animation={badgeAnimation} />
          )}
          {imageLoading && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {imageError || !image ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-1"
              style={{ backgroundColor: placeholderBg }}
            >
              <span className="text-4xl font-bold text-white/90">{initial}</span>
              <span className="text-[10px] text-white/70 px-2 text-center line-clamp-1">{title}</span>
            </div>
          ) : (
            <img
              src={image}
              alt={title}
              loading="lazy"
              decoding="async"
              className={`h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                imageLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageLoading(false);
                setImageError(true);
              }}
            />
          )}
        </div>
        <div className="p-2.5 sm:p-4 text-center">
          <p className="text-xs sm:text-sm font-medium text-foreground/90 tracking-wide line-clamp-2">
            {title}
          </p>
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link}>{CardContent}</Link>;
  }

  return CardContent;
};
