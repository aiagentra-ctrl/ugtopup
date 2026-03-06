import { ExternalLink } from 'lucide-react';

export interface ProductCardData {
  name: string;
  price: string;
  image_url: string | null;
  link: string | null;
  delivery_time?: string;
}

interface ProductCardBubbleProps {
  product: ProductCardData;
}

export const ProductCardBubble = ({ product }: ProductCardBubbleProps) => {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm max-w-[260px] animate-in fade-in slide-in-from-bottom-2 duration-300">
      {product.image_url && (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-32 object-cover"
          loading="lazy"
        />
      )}
      <div className="p-3 space-y-2">
        <h4 className="text-sm font-semibold text-foreground leading-tight">{product.name}</h4>
        <p className="text-primary font-bold text-base">{product.price}</p>
        {product.delivery_time && (
          <p className="text-xs text-muted-foreground">🚀 Delivery: {product.delivery_time}</p>
        )}
        {product.link && (
          <a
            href={product.link}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Buy Now <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
