import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

export const EmptyState = ({
  icon: Icon = Inbox,
  title,
  description,
  ctaLabel,
  onCta,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  onCta?: () => void;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 px-4 py-10 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
    <div className="text-[14px] font-medium text-foreground">{title}</div>
    <div className="max-w-xs text-[13px] text-muted-foreground">{description}</div>
    {ctaLabel && (
      <Button size="sm" onClick={onCta} className="mt-1">
        {ctaLabel}
      </Button>
    )}
  </div>
);
