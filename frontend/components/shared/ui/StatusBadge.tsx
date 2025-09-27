"use client";
import { cn } from "@/lib/utils";

const statusMap: Record<string, string> = {
  active: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  completed:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  cancelled:
    "bg-gray-500/15 text-gray-600 dark:text-gray-300 border-gray-500/30",
  "in-progress":
    "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  open: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full border text-[11px] font-medium tracking-wide capitalize backdrop-blur-sm",
        statusMap[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
