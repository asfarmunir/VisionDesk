import { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  loading?: boolean;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  loading,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-xl border bg-card/60 backdrop-blur p-4 flex flex-col gap-2 shadow-sm hover:shadow transition-shadow",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
            {label}
          </span>
          {loading ? (
            <div className="h-7 w-16 animate-pulse rounded bg-muted/50" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums leading-none truncate">
              {value}
            </span>
          )}
        </div>
        {icon && (
          <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-secondary/20 text-primary">
            {icon}
          </div>
        )}
      </div>
      {trend && !loading && (
        <div className="text-xs font-medium flex items-center gap-1">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded-md",
              trend.value >= 0
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            )}
          >
            {trend.value > 0 ? "+" : ""}
            {trend.value}%
          </span>
          <span className="text-muted-foreground truncate">
            {trend.label || "vs last period"}
          </span>
        </div>
      )}
    </div>
  );
}
