import { Skeleton } from "@/components/ui/skeleton";

export const SkeletonRow = () => (
  <div className="flex items-center gap-3 border-b border-border/60 px-3 py-3 last:border-b-0">
    <Skeleton className="h-8 w-8 rounded-md" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    <Skeleton className="h-5 w-16 rounded-full" />
  </div>
);

export const SkeletonStat = () => (
  <div className="rounded-lg bg-muted/40 p-4">
    <Skeleton className="mb-3 h-3 w-20" />
    <Skeleton className="h-7 w-24" />
  </div>
);
