import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ImageOff } from "lucide-react";
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

export const ProductCard = ({ image, title, link, badgeText, badgeColor, badgeTextColor, badgeAnimation }: ProductCardProps) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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
          {imageError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/40 gap-2">
              <ImageOff className="h-8 w-8 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Image unavailable</span>
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
