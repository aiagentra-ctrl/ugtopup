import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface Props {
  eyebrow?: string;
  title: string;
  icon?: any;
  description?: string;
  viewAllTo?: string;
  viewAllLabel?: string;
  right?: ReactNode;
}

export const SectionHeader = ({
  eyebrow, title, icon: Icon, description, viewAllTo, viewAllLabel = "View all", right,
}: Props) => (
  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && (
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          {eyebrow}
        </div>
      )}
      <h2 className="font-display flex items-center gap-2 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
        {Icon && <Icon className="h-5 w-5 text-primary drop-shadow-[0_0_8px_hsl(var(--primary))]" />}
        {title}
      </h2>
      {description && <p className="mt-1 text-[12px] text-muted-foreground sm:text-[13px]">{description}</p>}
    </div>
    <div className="flex items-center gap-2">
      {right}
      {viewAllTo && (
        <Link
          to={viewAllTo}
          className="group inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-primary/80"
        >
          {viewAllLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  </div>
);
