import { Link } from "react-router-dom";

interface ProductCardProps {
  image: string;
  title: string;
  link?: string;
  onBuyNow?: () => void;
}

export const ProductCard = ({ image, title, link }: ProductCardProps) => {
  const CardContent = (
    <div className="group cursor-pointer">
      <div className="overflow-hidden rounded-xl bg-neutral-900/40 border border-neutral-800 transition-all duration-300 ease-out hover:border-neutral-700 hover:shadow-xl hover:shadow-neutral-900/50 hover:-translate-y-1">
        <div className="aspect-square overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>
        <div className="p-4 text-center">
          <p className="text-sm font-medium text-neutral-200 tracking-wide">
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
