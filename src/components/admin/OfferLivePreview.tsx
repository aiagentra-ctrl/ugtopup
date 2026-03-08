import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OfferBanner } from "@/components/offers/OfferBanner";
import { OfferBadge } from "@/components/offers/OfferBadge";
import { OfferHighlight } from "@/components/offers/OfferHighlight";
import { OfferSeasonal } from "@/components/offers/OfferSeasonal";
import { OfferDailyDeal } from "@/components/offers/OfferDailyDeal";
import type { Offer } from "@/hooks/useOffers";

interface OfferLivePreviewProps {
  form: {
    title: string;
    subtitle: string;
    description: string;
    image_url: string;
    offer_type: string;
    timer_enabled: boolean;
    timer_type: string;
    timer_end_date: string;
    timer_start_date: string;
    product_link: string;
    custom_icon_url: string;
    show_on_homepage: boolean;
    show_on_product_page: boolean;
    is_active: boolean;
    design_template: string;
    badge_text: string;
    badge_color: string;
    badge_text_color: string;
    animation_type: string;
    seasonal_theme: string;
    background_gradient: string;
  };
}

function formToOffer(form: OfferLivePreviewProps["form"]): Offer {
  return {
    id: "preview",
    title: form.title || "Offer Title",
    subtitle: form.subtitle || null,
    description: form.description || null,
    image_url: form.image_url || null,
    offer_type: form.offer_type,
    timer_enabled: form.timer_enabled,
    timer_type: form.timer_type || null,
    timer_end_date: form.timer_end_date ? new Date(form.timer_end_date).toISOString() : null,
    timer_start_date: form.timer_start_date ? new Date(form.timer_start_date).toISOString() : null,
    product_link: form.product_link || null,
    custom_icon_url: form.custom_icon_url || null,
    display_order: 0,
    is_active: form.is_active,
    show_on_homepage: form.show_on_homepage,
    show_on_product_page: form.show_on_product_page,
    design_template: form.design_template,
    badge_text: form.badge_text || null,
    badge_color: form.badge_color || null,
    badge_text_color: form.badge_text_color || null,
    animation_type: form.animation_type || null,
    seasonal_theme: form.seasonal_theme || null,
    background_gradient: form.background_gradient || null,
  };
}

export function OfferLivePreview({ form }: OfferLivePreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const offer = formToOffer(form);

  const renderPreview = () => {
    switch (form.design_template) {
      case "animated_banner":
        return <OfferBanner offer={offer} />;
      case "homepage_highlight":
        return <OfferHighlight offer={offer} />;
      case "seasonal":
        return <OfferSeasonal offer={offer} />;
      case "daily_deal":
        return <OfferDailyDeal offer={offer} />;
      case "badge":
      default:
        return (
          <div className="relative w-40 h-48 rounded-xl bg-muted border flex items-center justify-center">
            {form.badge_text && (
              <OfferBadge
                text={form.badge_text}
                color={form.badge_color}
                textColor={form.badge_text_color}
                animation={form.animation_type}
              />
            )}
            <span className="text-xs text-muted-foreground">Product Card</span>
          </div>
        );
    }
  };

  return (
    <div className="border rounded-xl bg-muted/30 flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</span>
        <div className="flex gap-1">
          <Button
            variant={viewMode === "desktop" ? "default" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("desktop")}
          >
            <Monitor className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={viewMode === "mobile" ? "default" : "ghost"}
            size="icon"
            className="h-7 w-7"
            onClick={() => setViewMode("mobile")}
          >
            <Smartphone className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div
          className="transition-all duration-300"
          style={{ width: viewMode === "mobile" ? 320 : "100%", maxWidth: "100%" }}
        >
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}
