import { useState, useEffect } from "react";
import { Zap, Flame } from "lucide-react";

// 7 days in seconds
const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

// Fixed anchor date - November 30, 2025 00:00:00 UTC
const ANCHOR_DATE = new Date('2025-11-30T00:00:00Z').getTime();

// Calculate remaining time in current 7-day cycle
const calculateRemainingTime = () => {
  const now = Date.now();
  const elapsedMs = now - ANCHOR_DATE;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);
  
  // Position in the current 7-day cycle
  const positionInCycle = elapsedSeconds % SEVEN_DAYS_IN_SECONDS;
  
  // Remaining seconds in this cycle
  const remaining = SEVEN_DAYS_IN_SECONDS - positionInCycle;
  
  return remaining;
};

export const BestDeals = () => {
  const [secondsLeft, setSecondsLeft] = useState(calculateRemainingTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(calculateRemainingTime());
    }, 1000);

    // Cleanup on unmount
    return () => clearInterval(timer);
  }, []);

  // Calculate days, hours, minutes, seconds from total seconds
  const days = Math.floor(secondsLeft / (24 * 60 * 60));
  const hours = Math.floor((secondsLeft % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((secondsLeft % (60 * 60)) / 60);
  const seconds = secondsLeft % 60;

  // Format with leading zeros
  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <section className="py-12 md:py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center space-y-6 text-center">
          {/* Best Deals Title */}
          <h2 
            className="flex items-center justify-center gap-3 text-2xl md:text-4xl font-bold tracking-wider"
            aria-label="Best Deals"
          >
            <Zap className="w-7 h-7 md:w-10 md:h-10 text-yellow-400 fill-yellow-400" />
            <span className="text-primary uppercase" style={{ letterSpacing: '0.1em' }}>
              BEST DEALS
            </span>
            <Flame className="w-7 h-7 md:w-10 md:h-10 text-orange-500 fill-orange-500" />
          </h2>

          {/* Dynamic Countdown Timer */}
          <div 
            className="flex items-center justify-center gap-2 md:gap-4 text-xl md:text-3xl font-semibold text-foreground/90"
            role="status"
            aria-label="Deal time remaining"
            aria-live="polite"
          >
            <span className="tabular-nums">{formatNumber(days)}D</span>
            <span className="text-muted-foreground">:</span>
            <span className="tabular-nums">{formatNumber(hours)}H</span>
            <span className="text-muted-foreground">:</span>
            <span className="tabular-nums">{formatNumber(minutes)}M</span>
            <span className="text-muted-foreground">:</span>
            <span className="tabular-nums">{formatNumber(seconds)}S</span>
          </div>
        </div>
      </div>
    </section>
  );
};
