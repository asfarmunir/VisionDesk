import { cn } from "../../lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const map: Record<string, { label: string; className: string }> = {
    open: {
      label: "Open",
      className: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
    },
    active: {
      label: "Active",
      className: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
    },
    pending: {
      label: "Pending",
      className: "bg-amber-500/15 text-amber-600 dark:text-amber-300",
    },
    in_progress: {
      label: "In Progress",
      className: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300",
    },
    done: {
      label: "Done",
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    },
    closed: {
      label: "Closed",
      className: "bg-gray-500/15 text-gray-600 dark:text-gray-300",
    },
    resolved: {
      label: "Resolved",
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    },
    failed: {
      label: "Failed",
      className: "bg-red-500/15 text-red-600 dark:text-red-400",
    },
  };
  const item = map[normalized] || {
    label: status,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-border",
        item.className,
        className
      )}
    >
      {item.label}
    </span>
  );
}
