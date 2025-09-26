import React from "react";
import { Icons } from "../ui/icons";

export interface ActivityItemData {
  id: string;
  type: "project" | "task" | "ticket" | "user";
  title: string;
  meta?: string;
  time: string;
}

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;
const iconMap: Record<ActivityItemData["type"], IconType> = {
  project: Icons.projects,
  task: Icons.tasks,
  ticket: Icons.tickets,
  user: Icons.user,
};

export function ActivityList({
  items,
  loading,
}: {
  items: ActivityItemData[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 rounded-md bg-muted/40 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No recent activity yet.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const Icon = iconMap[item.type];
        return (
          <li
            key={item.id}
            className="group flex items-center gap-3 rounded-md border p-3 bg-card/50 backdrop-blur hover:bg-card transition-colors"
          >
            <div className="h-9 w-9 rounded-md bg-gradient-to-br from-primary/15 to-secondary/20 flex items-center justify-center text-primary">
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              {item.meta && (
                <p className="text-xs text-muted-foreground truncate">
                  {item.meta}
                </p>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 font-medium whitespace-nowrap">
              {item.time}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
