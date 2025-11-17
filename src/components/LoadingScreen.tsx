import { useEffect, useState } from "react";
import ugGamingLogo from "@/assets/ug-app-icon.jpg";

export const LoadingScreen = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Fade out after minimum loading time
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] bg-background flex items-center justify-center transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Logo with circular spinner */}
        <div className="relative">
          {/* Spinning border */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary border-r-primary animate-spin" 
               style={{ width: '120px', height: '120px' }}
          />
          
          {/* Logo */}
          <div className="flex items-center justify-center p-4">
            <img 
              src={ugGamingLogo} 
              alt="UG GAMING" 
              className="w-24 h-24 object-contain rounded-full"
            />
          </div>
        </div>

        {/* Loading text */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
