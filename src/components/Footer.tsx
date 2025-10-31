import { Facebook, Youtube, MessageCircle, Music } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-[hsl(var(--footer-bg))] border-t border-[hsl(var(--footer-border))] py-12 md:py-16">
      <div className="container mx-auto px-6 md:px-8 lg:px-12 max-w-4xl">
        
        {/* Brand Section */}
        <div className="mb-10">
          <h2 className="text-4xl md:text-5xl font-bold text-[hsl(var(--footer-heading))] mb-4">
            UGTOPUPS
          </h2>
          <p className="text-[hsl(var(--footer-text))] text-base leading-relaxed">
            Fast, secure top-up for online games & digital gift cards. Trusted by gamers all over Nepal.
          </p>
        </div>

        {/* Contact Info Section */}
        <div className="mb-10">
          <h3 className="text-2xl md:text-3xl font-semibold text-[hsl(var(--footer-heading))] mb-4">
            Contact Info
          </h3>
          <div className="space-y-2">
            <div className="text-[hsl(var(--footer-text))] text-base">
              <span className="font-medium">Email:</span>{" "}
              <a 
                href="mailto:support@ugtops.com" 
                className="hover:text-[hsl(var(--footer-heading))] transition-colors duration-300"
              >
                support@ugtops.com
              </a>
            </div>
            <div className="text-[hsl(var(--footer-text))] text-base">
              <span className="font-medium">Phone:</span>{" "}
              <a 
                href="tel:9802436393" 
                className="hover:text-[hsl(var(--footer-heading))] transition-colors duration-300"
              >
                Helpline. 9802436393
              </a>
            </div>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="mb-10">
          <h3 className="text-2xl md:text-3xl font-semibold text-[hsl(var(--footer-heading))] mb-4">
            Quick Links
          </h3>
          <ul className="space-y-2">
            <li>
              <a 
                href="/dashboard" 
                className="text-[hsl(var(--footer-text))] text-base hover:text-[hsl(var(--footer-heading))] transition-colors duration-300"
              >
                Dashboard
              </a>
            </li>
            <li>
              <a 
                href="/" 
                className="text-[hsl(var(--footer-text))] text-base hover:text-[hsl(var(--footer-heading))] transition-colors duration-300"
              >
                Products
              </a>
            </li>
          </ul>
        </div>
        
        {/* Social Icons */}
        <div className="flex gap-4 mb-12">
          <a
            href="https://www.facebook.com/share/16tUHhfQQg/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="Facebook"
          >
            <Facebook className="h-6 w-6 md:h-7 md:w-7 text-[hsl(var(--footer-bg))]" />
          </a>
          <a
            href="https://youtube.com/@brolex_yt-23?si=w45itnYtc-UoJWmC"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="YouTube"
          >
            <Youtube className="h-6 w-6 md:h-7 md:w-7 text-[hsl(var(--footer-bg))]" />
          </a>
          <a
            href="https://www.tiktok.com/@myuggamingstore?_r=1&_t=ZS-9105XgEgpgD"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="TikTok"
          >
            <Music className="h-6 w-6 md:h-7 md:w-7 text-[hsl(var(--footer-bg))]" />
          </a>
          <a
            href="https://wa.me/9779708562001"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white flex items-center justify-center transition-all duration-300 hover:scale-110"
            aria-label="WhatsApp"
          >
            <MessageCircle className="h-6 w-6 md:h-7 md:w-7 text-[hsl(var(--footer-bg))]" />
          </a>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-[hsl(var(--footer-border))] pt-8 text-center space-y-3">
          <div className="text-sm text-[hsl(var(--footer-muted))]">
            © 2025 Topup. All rights reserved.
          </div>
          <div className="text-[13px] text-[hsl(var(--footer-muted))] leading-relaxed">
            Developed by{" "}
            <a 
              href="https://aiagentra.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-[hsl(var(--footer-heading))] transition-colors duration-300"
            >
              aiagentra.com
            </a>
            {" — "}
            <a 
              href="tel:+9779826884653"
              className="hover:text-[hsl(var(--footer-heading))] transition-colors duration-300"
            >
              +977 9826884653
            </a>
            {" "}
            <a 
              href="https://wa.me/9779826884653"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[hsl(var(--footer-heading))] transition-colors duration-300"
            >
              (WhatsApp)
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
