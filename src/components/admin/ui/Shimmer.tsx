import { cn } from "@/lib/utils";

interface ShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string | number;
  width?: string | number;
  rounded?: string;
}

export function Shimmer({ className, height = "1rem", width = "100%", rounded = "rounded-md", style, ...rest }: ShimmerProps) {
  return (
    <div
      className={cn("shimmer-block", rounded, className)}
      style={{ height, width, ...style }}
      {...rest}
    />
  );
}

export function ShimmerList({ rows = 5, rowHeight = 56 }: { rows?: number; rowHeight?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Shimmer key={i} height={rowHeight} rounded="rounded-lg" />
      ))}
    </div>
  );
}

export function ShimmerCard() {
  return (
    <div className="space-y-3 p-4 rounded-xl border border-border/50">
      <Shimmer height={20} width="40%" />
      <Shimmer height={36} width="70%" />
      <Shimmer height={14} width="90%" />
    </div>
  );
}
