import { Facebook, Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";
import downloadIcon from "@/assets/download-icon-new.png";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export const Footer = () => {
  const { isInstallable, promptInstall, isIOS, isInstalled, isLoading } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.success("App is already installed! 📱", {
        description: "Check your home screen for UGTOPUPS",
      });
      return;
    }
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    if (isInstallable) {
      const result = await promptInstall();
      if (result === "accepted") {
        toast.success("Installing UGTOPUPS! 🎉", {
          description: "App will appear on your home screen",
        });
      } else if (result === "dismissed") {
        toast.info("Installation cancelled");
      }
    }
  };

  const showDownloadOption = isIOS || isInstallable || isInstalled;

  const quickLinks = [
    { to: "/", label: "Products" },
    { to: "/dashboard", label: "Dashboard" },
    { to: "/refund-policy", label: "Refund Policy" },
    { to: "/coupon-policy", label: "Coupon Policy" },
    { to: "/contact", label: "Contact Us" },
    { to: "/api-docs", label: "API Docs" },
    { to: "/wishlist", label: "Wishlist" },
    { to: "/support", label: "Support" },
  ];

  return (
    <>
      <footer className="relative bg-[hsl(var(--footer-bg))] border-t border-[hsl(var(--footer-border))] py-12 md:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
        <div className="orb orb-primary w-72 h-72 -top-24 -left-20 animate-float-slow opacity-40" />
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <div className="container mx-auto px-6 md:px-8 lg:px-12 max-w-5xl relative">
          {/* Brand */}
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-3xl md:text-4xl font-bold animated-gradient-text">
                UGC Top Up
              </h2>
              {showDownloadOption && (
                <button
                  onClick={handleInstallClick}
                  disabled={isLoading}
                  className="group relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-600/30 flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-md disabled:opacity-50 animate-glow-pulse"
                  aria-label="Install UGTOPUPS App"
                  title={isInstalled ? "App Installed" : "Install UGTOPUPS App"}
                >
                  <img src={downloadIcon} alt="Download UGTOPUPS app" className="h-6 w-6 object-contain" />
                </button>
              )}
            </div>
            <p className="text-[hsl(var(--footer-text))] text-base leading-relaxed max-w-xl">
              The best place to top up your favorite games. Trusted by gamers all over Nepal.
            </p>
          </div>

          {/* Two columns: Social Media + Support */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-10">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--footer-heading))] mb-5">
                Social Media
              </h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="https://www.tiktok.com/@myuggamingstore?_r=1&_t=ZS-9105XgEgpgD"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-[hsl(var(--footer-text))] hover:text-[hsl(var(--footer-heading))] transition-colors"
                  >
                    <TikTokIcon className="h-6 w-6" />
                    <span className="text-lg">TikTok</span>
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.facebook.com/share/16tUHhfQQg/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-[hsl(var(--footer-text))] hover:text-[hsl(var(--footer-heading))] transition-colors"
                  >
                    <Facebook className="h-6 w-6" />
                    <span className="text-lg">Facebook</span>
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[hsl(var(--footer-heading))] mb-5">
                Support
              </h3>
              <ul className="space-y-4">
                <li>
                  <a
                    href="https://wa.me/9779708562001"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-[hsl(var(--footer-text))] hover:text-[hsl(var(--footer-heading))] transition-colors"
                  >
                    <MessageCircle className="h-6 w-6" />
                    <span className="text-lg">WhatsApp</span>
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@ugtops.com"
                    className="flex items-center gap-3 text-[hsl(var(--footer-text))] hover:text-[hsl(var(--footer-heading))] transition-colors"
                  >
                    <Mail className="h-6 w-6" />
                    <span className="text-lg">Email</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Scrollable quick links strip */}
          <div className="mb-8 -mx-6 px-6 md:-mx-8 md:px-8">
            <div className="flex gap-2 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
              {quickLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="snap-start shrink-0 card-premium sheen px-4 py-2 rounded-full text-sm text-[hsl(var(--footer-text))] hover:text-primary transition-all whitespace-nowrap hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-8px_hsl(var(--primary)/0.5)]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-[hsl(var(--footer-border))] pt-6 text-center space-y-2 relative">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="text-sm text-[hsl(var(--footer-muted))]">
              © 2025 UGTOPUPS. All rights reserved.
            </div>
            <div className="text-[13px] text-[hsl(var(--footer-muted))] leading-relaxed">
              Developed by{" "}
              <a
                href="https://aiagentra.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[hsl(var(--footer-heading))] transition-colors"
              >
                aiagentra.com
              </a>
            </div>
          </div>
        </div>
      </footer>

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
