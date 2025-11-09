import { useState, useEffect } from "react";

const testimonials = [
  {
    id: 1,
    name: "Prakash Tamang",
    feedback: "UGTopups never disappoints — trusted and offers the best rates in Nepal.",
  },
  {
    id: 2,
    name: "Nikita Bhattrai",
    feedback: "Super quick delivery and excellent customer support. 100% genuine site.",
  },
  {
    id: 3,
    name: "Rojit Tamang",
    feedback: "Affordable, instant, and trustworthy. My go-to top-up site every time.",
  },
  {
    id: 4,
    name: "Tirtha Raj",
    feedback: "Best experience ever. No delays or issues — just fast and professional service.",
  },
  {
    id: 5,
    name: "Raju Das",
    feedback: "UGTopups is the only platform I trust for Free Fire diamonds. Excellent work.",
  },
  {
    id: 6,
    name: "Abhiraj Yadav",
    feedback: "Quick, safe, and easy. I'll continue using UGTopups for all my future top-ups.",
  },
];

export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
          CUSTOMER REVIEWS
        </h2>

        <div className="relative mx-auto max-w-3xl">
          <div className="overflow-hidden">
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`transition-opacity duration-500 ${
                  index === currentIndex ? "opacity-100" : "absolute opacity-0"
                }`}
              >
                <div className="glass-card rounded-2xl p-8 md:p-12">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary text-xl font-bold">
                      {testimonial.name.charAt(0).toUpperCase()}
                    </div>
                    <p className="font-bold text-lg text-primary">
                      {testimonial.name}
                    </p>
                  </div>
                  <p className="text-lg leading-relaxed text-foreground">
                    "{testimonial.feedback}"
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Dot Indicators */}
          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-primary glow-border"
                    : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
