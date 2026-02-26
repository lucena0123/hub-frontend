import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-white/[0.06]', className)}
      {...props}
    />
  );
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('edge-card p-5 space-y-3', className)}>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-3 w-32" />
      <div className="border-t border-border/30 pt-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-7 rounded-md" />
        <Skeleton className="h-7 rounded-md" />
      </div>
    </div>
  );
}

function SkeletonMetric({ className }: { className?: string }) {
  return (
    <div className={cn('edge-card px-5 py-4 space-y-2', className)}>
      <Skeleton className="h-2 w-20" />
      <Skeleton className="h-7 w-28" />
    </div>
  );
}

function SkeletonRow({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 py-3 px-4', className)}>
      <Skeleton className="h-2 w-2 rounded-full flex-shrink-0" />
      <Skeleton className="h-3 flex-1" />
      <Skeleton className="h-3 w-10" />
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonMetric, SkeletonRow };
