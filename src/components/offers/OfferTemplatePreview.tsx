import { cn } from "@/lib/utils";

const templates = [
  { id: "badge", label: "Badge", desc: "Small label on product cards", icon: "🏷️" },
  { id: "animated_banner", label: "Banner", desc: "Full-width animated banner", icon: "📢" },
  { id: "homepage_highlight", label: "Highlight", desc: "Featured promotional block", icon: "⭐" },
  { id: "seasonal", label: "Seasonal", desc: "Festival-themed design", icon: "🎉" },
  { id: "daily_deal", label: "Daily Deal", desc: "Countdown timer card", icon: "⏰" },
];

interface OfferTemplatePreviewProps {
  selected: string;
  onSelect: (template: string) => void;
}

export function OfferTemplatePreview({ selected, onSelect }: OfferTemplatePreviewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t.id)}
          className={cn(
            "flex flex-col items-center gap-1 p-3 rounded-lg border-2 text-center transition-all",
            selected === t.id
              ? "border-primary bg-primary/10 shadow-md"
              : "border-border hover:border-primary/50"
          )}
        >
          <span className="text-2xl">{t.icon}</span>
          <span className="text-xs font-semibold">{t.label}</span>
          <span className="text-[10px] text-muted-foreground">{t.desc}</span>
        </button>
      ))}
    </div>
  );
}
