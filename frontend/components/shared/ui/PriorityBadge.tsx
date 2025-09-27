"use client";
import { cn } from "@/lib/utils";

const priorityMap: Record<string, string> = {
  low: "from-emerald-400/60 to-emerald-600/60 text-emerald-600 dark:text-emerald-300",
  medium:
    "from-amber-400/60 to-amber-600/60 text-amber-600 dark:text-amber-300",
  high: "from-orange-400/60 to-orange-600/60 text-orange-600 dark:text-orange-300",
  urgent:
    "from-rose-500/60 to-rose-700/60 text-rose-600 dark:text-rose-300 animate-pulse",
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "relative px-2 xl:w-24 text-center  rounded-full text-[11px] font-semibold tracking-wide capitalize border border-white/10 bg-gradient-to-br shadow-inner backdrop-blur-sm",
        priorityMap[priority] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {priority}
    </span>
  );
}

export default PriorityBadge;
