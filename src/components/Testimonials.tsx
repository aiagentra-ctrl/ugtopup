import { useState, useEffect } from "react";
import { Quote, Star } from "lucide-react";

const testimonials = [
  { id: 1, name: "Prakash Tamang", game: "Free Fire", feedback: "UGTopups never disappoints — trusted and offers the best rates in Nepal." },
  { id: 2, name: "Nikita Bhattrai", game: "Mobile Legends", feedback: "Super quick delivery and excellent customer support. 100% genuine site." },
  { id: 3, name: "Rojit Tamang", game: "PUBG", feedback: "Affordable, instant, and trustworthy. My go-to top-up site every time." },
  { id: 4, name: "Tirtha Raj", game: "Garena", feedback: "Best experience ever. No delays or issues — just fast and professional service." },
  { id: 5, name: "Raju Das", game: "Free Fire", feedback: "UGTopups is the only platform I trust for Free Fire diamonds. Excellent work." },
  { id: 6, name: "Abhiraj Yadav", game: "Netflix", feedback: "Quick, safe, and easy. I'll continue using UGTopups for all my future top-ups." },
];

const palette = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(38 100% 55%)", "hsl(200 90% 55%)", "hsl(280 80% 60%)", "hsl(142 70% 45%)"];

const TestimonialCard = ({ t, i }: { t: typeof testimonials[number]; i: number }) => (
  <div className="card-premium sheen glass-premium-hover relative p-5 sm:p-6 rounded-xl group">
    <Quote className="absolute right-4 top-4 h-7 w-7 text-primary/20 group-hover:text-primary/40 transition-colors" />
    <div className="mb-3 flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, j) => (
        <Star
          key={j}
          className="h-4 w-4 fill-current animate-star-twinkle"
          style={{ animationDelay: `${j * 0.18}s` }}
        />
      ))}
    </div>
    <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/90 min-h-[72px]">
      "{t.feedback}"
    </p>
    <div className="mt-5 flex items-center gap-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-white/10 group-hover:ring-primary/50 transition-all"
        style={{ background: `linear-gradient(135deg, ${palette[i % palette.length]}, hsl(var(--primary)))` }}
      >
        {t.name.charAt(0).toUpperCase()}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{t.name}</p>
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{t.game} player</p>
      </div>
    </div>
  </div>
);

export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative py-12 sm:py-20 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="orb orb-primary w-72 h-72 top-10 -left-20 animate-float-slow" />
      <div className="orb orb-secondary w-80 h-80 bottom-0 -right-16 animate-float" />

      <div className="container relative mx-auto px-3 sm:px-4">
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block px-3 py-1 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] rounded-full border border-primary/30 bg-primary/10 text-primary mb-4">
            ★ Players Love Us
          </span>
          <h2 className="text-2xl font-bold sm:text-3xl md:text-5xl">
            <span className="animated-gradient-text">CUSTOMER REVIEWS</span>
          </h2>
        </div>

        {/* Desktop: 3-up grid */}
        <div className="hidden md:grid gap-5 grid-cols-3 max-w-6xl mx-auto">
          {testimonials.slice(0, 3).map((t, i) => (
            <TestimonialCard key={t.id} t={t} i={i} />
          ))}
          {testimonials.slice(3, 6).map((t, i) => (
            <TestimonialCard key={t.id} t={t} i={i + 3} />
          ))}
        </div>

        {/* Mobile: single rotating */}
        <div className="md:hidden relative max-w-md mx-auto">
          <div className="relative min-h-[260px]">
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                className={`transition-all duration-700 ${
                  i === currentIndex ? "opacity-100 relative" : "opacity-0 absolute inset-0 pointer-events-none"
                }`}
              >
                <TestimonialCard t={t} i={i} />
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentIndex
                    ? "w-8 bg-primary animate-glow-pulse"
                    : "w-2 bg-muted hover:bg-muted-foreground"
                }`}
                aria-label={`Review ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
