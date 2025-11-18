import { Facebook, Youtube, MessageCircle, Music } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import downloadIcon from "@/assets/download-icon.png";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export const Footer = () => {
  const { isInstallable, promptInstall, isIOS } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!isInstallable) {
      toast.info('App install is supported on Android/Chrome and iPhone (Add to Home Screen).');
      return;
    }

    const result = await promptInstall();
    
    if (result === 'accepted') {
      toast.success('App installed! Find UGTOPUPS on your home screen 🎉');
    } else if (result === 'dismissed') {
      toast.info('You can install UGTOPUPS later from your browser menu');
    }
  };

  return (
    <>
      <footer className="bg-[hsl(var(--footer-bg))] border-t border-[hsl(var(--footer-border))] py-12 md:py-16">
        <div className="container mx-auto px-6 md:px-8 lg:px-12 max-w-4xl">
          
          {/* Brand Section */}
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-4xl md:text-5xl font-bold text-[hsl(var(--footer-heading))]">
                UGC Top Up
              </h2>
              <button
                onClick={handleInstallClick}
                className="group relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30 flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-md"
                aria-label="Install UGTOPUPS App"
                title="Install UGTOPUPS App"
              >
                <img src={downloadIcon} alt="Download UGTOPUPS app" className="h-6 w-6 object-contain" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  Install App
                </span>
              </button>
            </div>
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
                href="tel:+9779708562001" 
                className="hover:text-[hsl(var(--footer-heading))] transition-colors duration-300"
              >
                Helpline. +977 9708562001
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

    {/* iOS Installation Instructions Modal */}
    <AlertDialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
      <AlertDialogContent className="bg-slate-900 border-slate-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-100 text-xl">Install UGTOPUPS on iOS</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-300 space-y-3 text-left">
            <p className="font-semibold">To install this app on your iPhone or iPad:</p>
            <ol className="list-decimal list-inside space-y-2 ml-2">
              <li>Tap the <strong>Share</strong> button at the bottom of Safari</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong></li>
              <li>Tap <strong>Add</strong> to confirm</li>
            </ol>
            <p className="mt-4 text-sm">The UGTOPUPS icon will appear on your home screen!</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
