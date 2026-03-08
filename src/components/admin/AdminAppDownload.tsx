import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Smartphone,
  Bell,
  Shield,
  Zap,
  CheckCircle2,
  Monitor,
} from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { toast } from "sonner";

const features = [
  { icon: Bell, title: "Real-Time Push Notifications", description: "Get instant alerts for new orders, credit requests, and API failures" },
  { icon: Zap, title: "Quick Actions", description: "Approve orders, manage vouchers, and monitor inventory on the go" },
  { icon: Shield, title: "Secure Admin Access", description: "Protected by admin authentication and session management" },
  { icon: Monitor, title: "Full Dashboard", description: "Access all admin features optimized for mobile screens" },
];

export function AdminAppDownload() {
  const { isInstallable, isInstalled, isLoading, promptInstall, isIOS, isStandalone } = usePWAInstall();

  const handleInstall = async () => {
    if (isInstalled || isStandalone) {
      toast.info("App is already installed!");
      return;
    }

    if (isIOS) {
      toast.info("Tap the Share button in Safari, then 'Add to Home Screen'");
      return;
    }

    if (!isInstallable) {
      toast.info("Open this page in Chrome or Edge browser to install the app");
      return;
    }

    const result = await promptInstall();
    if (result === 'accepted') {
      toast.success("Admin App installed successfully!");
    } else if (result === 'dismissed') {
      toast.info("Installation cancelled");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Card */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6 lg:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30 shrink-0">
              <Smartphone className="h-10 w-10 text-primary-foreground" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold text-foreground">Admin Mobile App</h2>
              <p className="text-muted-foreground mt-1">
                Install the admin panel as a mobile app for instant access and push notifications
              </p>
              <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                <Badge variant="secondary">PWA</Badge>
                <Badge variant="secondary">Offline Ready</Badge>
                <Badge variant="secondary">Push Notifications</Badge>
              </div>
            </div>
            <div className="shrink-0">
              {isInstalled || isStandalone ? (
                <Button disabled className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Installed
                </Button>
              ) : (
                <Button onClick={handleInstall} disabled={isLoading} size="lg" className="gap-2">
                  <Download className="h-5 w-5" />
                  {isLoading ? "Installing..." : "Install App"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* iOS Instructions */}
      {isIOS && !isInstalled && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-3">📱 iOS Installation</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2"><span className="font-bold text-foreground">1.</span> Tap the <strong>Share</strong> button in Safari (square with arrow)</li>
              <li className="flex gap-2"><span className="font-bold text-foreground">2.</span> Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li className="flex gap-2"><span className="font-bold text-foreground">3.</span> Tap <strong>"Add"</strong> to confirm</li>
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {features.map((feature, i) => (
          <Card key={i} className="bg-card/50 border-border hover:bg-card/80 transition-colors">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Push Notification Events</CardTitle>
          <CardDescription>You'll receive instant alerts for these events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              "🛒 New order received",
              "💳 Credit request submitted",
              "⚠️ API order failed",
              "🎫 Voucher code delivered",
              "✅ Order confirmed",
              "❌ Order cancelled",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-muted/30">
                <span>{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
