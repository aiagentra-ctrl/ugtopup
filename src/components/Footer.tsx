import { Facebook, Youtube, MessageCircle, Music } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-[hsl(var(--footer-bg))] border-t border-[hsl(var(--footer-border))] py-16">
      <div className="container mx-auto px-4 md:px-8 lg:px-12">
        {/* Three Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          
          {/* Column 1: Branding */}
          <div className="text-center lg:text-left">
            <h2 className="text-4xl md:text-[40px] font-bold text-[hsl(var(--footer-heading))] mb-3">
              UG TOPUPS
            </h2>
            <div className="inline-block bg-[hsl(var(--footer-badge-bg))] text-[hsl(var(--footer-badge-text))] px-6 py-2 rounded-full text-base font-semibold mb-4">
              All over Nepal
            </div>
            <p className="text-[hsl(var(--footer-text))] text-[15px] leading-relaxed max-w-[350px] mx-auto lg:mx-0">
              Fast, secure top-up for online games and digital gift cards. Trusted by gamers worldwide.
            </p>
          </div>

          {/* Column 2: Contact Info */}
          <div className="text-center lg:text-left">
            <h3 className="text-2xl font-semibold text-[hsl(var(--footer-heading))] mb-6">
              Contact Info
            </h3>
            <div className="space-y-3">
              <div className="text-[hsl(var(--footer-text))] text-base">
                <span className="font-medium">Email:</span>{" "}
                <a 
                  href="mailto:support@ugtopups.com" 
                  className="hover:text-[hsl(var(--footer-heading))] transition-colors duration-300"
                >
                  support@ugtopups.com
                </a>
              </div>
              <div className="text-[hsl(var(--footer-text))] text-base">
                <span className="font-medium">Phone:</span>{" "}
                <a 
                  href="tel:+9779812287724" 
                  className="hover:text-[hsl(var(--footer-heading))] transition-colors duration-300"
                >
                  +977 981-2287724
                </a>
              </div>
            </div>
          </div>

          {/* Column 3: Quick Links + Social */}
          <div className="text-center lg:text-left">
            <h3 className="text-2xl font-semibold text-[hsl(var(--footer-heading))] mb-6">
              Quick Links
            </h3>
            <ul className="mb-8">
              <li>
                <a 
                  href="/dealer" 
                  className="text-[hsl(var(--footer-text))] text-base hover:text-[hsl(var(--footer-heading))] hover:underline transition-all duration-300"
                >
                  Become a Dealer
                </a>
              </li>
            </ul>
            
            {/* Social Icons */}
            <div className="flex justify-center lg:justify-start gap-4">
              <a
                href="https://facebook.com/ugtopups"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center transition-all duration-300 hover:bg-white group"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6 text-white group-hover:text-[hsl(var(--footer-bg))] transition-colors duration-300" />
              </a>
              <a
                href="https://youtube.com/@ugtopups"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center transition-all duration-300 hover:bg-white group"
                aria-label="YouTube"
              >
                <Youtube className="h-6 w-6 text-white group-hover:text-[hsl(var(--footer-bg))] transition-colors duration-300" />
              </a>
              <a
                href="https://tiktok.com/@ugtopups"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center transition-all duration-300 hover:bg-white group"
                aria-label="TikTok"
              >
                <Music className="h-6 w-6 text-white group-hover:text-[hsl(var(--footer-bg))] transition-colors duration-300" />
              </a>
              <a
                href="https://wa.me/9779812287724"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center transition-all duration-300 hover:bg-white group"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-6 w-6 text-white group-hover:text-[hsl(var(--footer-bg))] transition-colors duration-300" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-[hsl(var(--footer-border))] pt-8 text-center space-y-4">
          <div className="text-lg font-semibold text-white">
            ugtopups.com
          </div>
          <div className="text-sm text-[hsl(var(--footer-muted))]">
            © 2025 UG TOPUPS. All rights reserved.
          </div>
          <div className="text-[13px] text-[hsl(var(--footer-muted))] leading-relaxed max-w-md mx-auto">
            Made by Aiagentra.com — +977 9826884653<br />
            If you need a similar website for your business.
          </div>
        </div>
      </div>
    </footer>
  );
};
