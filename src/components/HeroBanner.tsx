import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const slides = [
  {
    id: 1,
    image: "https://i.ibb.co/8g6kkFqj/SAVE-20251108-163252.jpg",
    title: "UG GAMING STORE",
    subtitle: "Best Price • 100% Trusted • Instant Delivery",
    ctaText: "Order Now",
  },
  {
    id: 2,
    image: "https://i.ibb.co/JW63HtJt/SAVE-20251108-163202.jpg",
    title: "TOP-UP YOUR FAVORITE GAMES",
    subtitle: "Fast & Secure • Best Prices • 24/7 Support",
    ctaText: "Shop Now",
  },
  {
    id: 3,
    image: "https://i.ibb.co/tp2RLMF0/SAVE-20251108-163211.jpg",
    title: "INSTANT DELIVERY",
    subtitle: "Get your game credits instantly",
    ctaText: "Order Now",
  },
];

export const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({
    0: true,
    1: true,
    2: true,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full max-w-7xl mx-auto mb-8 overflow-hidden rounded-2xl shadow-2xl animate-fade-in">
      {/* 16:9 Aspect Ratio Container */}
      <AspectRatio ratio={16 / 9} className="relative w-full bg-black">
        <div className="relative h-full w-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                index === currentSlide 
                  ? "opacity-100 scale-100" 
                  : "opacity-0 scale-105"
              }`}
            >
              <div className="relative h-full w-full">
                {imageLoading[index] && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  </div>
                )}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className={`h-full w-full object-cover object-center transition-opacity duration-300 ${
                    imageLoading[index] ? 'opacity-0' : 'opacity-100'
                  }`}
                  loading={index === 0 ? "eager" : "lazy"}
                  onLoad={() => setImageLoading(prev => ({ ...prev, [index]: false }))}
                  onError={() => setImageLoading(prev => ({ ...prev, [index]: false }))}
                />
                {/* Subtle Gradient Overlay for Text Readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent" />
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows - Perfectly Centered */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/70 p-2 backdrop-blur-md transition-all duration-300 hover:bg-background/90 hover:glow-border hover:scale-110 md:left-6 md:p-3"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-4 w-4 text-foreground md:h-5 md:w-5" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/70 p-2 backdrop-blur-md transition-all duration-300 hover:bg-background/90 hover:glow-border hover:scale-110 md:right-6 md:p-3"
          aria-label="Next slide"
        >
          <ChevronRight className="h-4 w-4 text-foreground md:h-5 md:w-5" />
        </button>

        {/* Pagination Dots - Aligned Bottom Center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2 md:bottom-6">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`rounded-full transition-all duration-500 ${
                index === currentSlide
                  ? "h-2 w-8 bg-primary glow-border opacity-100 md:h-2.5 md:w-10"
                  : "h-2 w-2 bg-muted/60 opacity-60 hover:bg-muted hover:opacity-100 md:h-2.5 md:w-2.5"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </AspectRatio>
    </div>
  );
};
