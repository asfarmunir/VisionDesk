import { cn } from "../../lib/utils";

export function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; className: string }> = {
    admin: {
      label: "Admin",
      className: "bg-purple-500/15 text-purple-600 dark:text-purple-300",
    },
    moderator: {
      label: "Moderator",
      className: "bg-blue-500/15 text-blue-600 dark:text-blue-300",
    },
    user: {
      label: "User",
      className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
    },
  };

  const item = config[role] || {
    label: role,
    className: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-border",
        item.className
      )}
    >
      {item.label}
    </span>
  );
}
