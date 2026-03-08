import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProductCardProps {
  image: string;
  title: string;
  link?: string;
  onBuyNow?: () => void;
}

export const ProductCard = ({ image, title, link }: ProductCardProps) => {
  const [imageLoading, setImageLoading] = useState(true);

  const CardContent = (
    <div className="group cursor-pointer">
      <div className="overflow-hidden rounded-xl bg-neutral-900/40 border border-neutral-800 transition-all duration-300 ease-out hover:border-neutral-700 hover:shadow-xl hover:shadow-neutral-900/50 hover:-translate-y-1">
        <div className="aspect-square overflow-hidden relative">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
              imageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        </div>
        <div className="p-2.5 sm:p-4 text-center">
          <p className="text-xs sm:text-sm font-medium text-neutral-200 tracking-wide line-clamp-2">
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
