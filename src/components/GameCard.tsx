interface GameCardProps {
  image: string;
  title: string;
}

export const GameCard = ({ image, title }: GameCardProps) => {
  return (
    <div className="group cursor-pointer">
      <div className="overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:scale-105 hover:border-primary glow-border">
        <div className="aspect-square">
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
      </div>
      <p className="mt-2 sm:mt-3 text-center text-xs sm:text-sm font-medium text-foreground line-clamp-1">
        {title}
      </p>
    </div>
  );
};
