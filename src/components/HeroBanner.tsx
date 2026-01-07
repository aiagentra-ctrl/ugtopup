import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useBannerSlides } from "@/hooks/useBannerSlides";

export const HeroBanner = () => {
  const { slides, loading } = useBannerSlides();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({});

  // Initialize loading state when slides change
  useEffect(() => {
    if (slides.length > 0) {
      const initialLoadingState: { [key: number]: boolean } = {};
      slides.forEach((_, index) => {
        initialLoadingState[index] = true;
      });
      setImageLoading(initialLoadingState);
    }
  }, [slides]);

  // Auto-slide
  useEffect(() => {
    if (slides.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Reset current slide if it's out of bounds
  useEffect(() => {
    if (currentSlide >= slides.length && slides.length > 0) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full max-w-7xl mx-auto mb-8 overflow-hidden rounded-2xl shadow-2xl animate-fade-in">
        <AspectRatio ratio={16 / 9} className="relative w-full bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </AspectRatio>
      </div>
    );
  }

  // Empty state
  if (slides.length === 0) {
    return (
      <div className="relative w-full max-w-7xl mx-auto mb-8 overflow-hidden rounded-2xl shadow-2xl animate-fade-in">
        <AspectRatio ratio={16 / 9} className="relative w-full bg-muted">
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground">No banners available</p>
          </div>
        </AspectRatio>
      </div>
    );
  }

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
                  src={slide.image_url}
                  alt={slide.title || "Banner"}
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

        {/* Navigation Arrows - Only show if more than 1 slide */}
        {slides.length > 1 && (
          <>
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
          </>
        )}

        {/* Pagination Dots - Only show if more than 1 slide */}
        {slides.length > 1 && (
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
        )}
      </AspectRatio>
    </div>
  );
};
