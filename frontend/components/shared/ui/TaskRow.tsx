"use client";
import { ProjectTask } from "@/lib/api/projects";
import { cn } from "@/lib/utils";
import PriorityBadge from "./PriorityBadge";
import StatusBadge from "./StatusBadge";
import { useUpdateTask } from "@/hooks/useUpdateTask";
import React from "react";
import { CheckCircle2, Loader } from "lucide-react";

export function TaskRow({
  task,
  projectId,
}: {
  task: ProjectTask;
  projectId?: string;
}) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = task.isOverdue;
  const { mutate: updateTask, isPending } = useUpdateTask();
  const [approving, setApproving] = React.useState(false);

  const approve = () => {
    if (task.status !== "closed") return;
    setApproving(true);
    updateTask(
      { id: task._id, data: { status: "approved" }, projectId },
      { onSettled: () => setApproving(false) }
    );
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border bg-background/70 backdrop-blur-sm px-3 py-3 flex flex-col gap-2 hover:border-primary/40 transition-colors group",
        overdue && "border-rose-500/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-xs 2xl:text-base truncate max-w-[200px] sm:max-w-[260px]">
            {task.title}
          </span>
          <PriorityBadge priority={task.priority} />
        </div>
        <div className="flex items-center gap-2">
          {task.status === "closed" && (
            <button
              disabled={isPending || approving}
              onClick={approve}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] 2xl:text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {approving || isPending ? (
                <Loader className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCircle2 className="h-3 w-3" />
              )}
              Approve
            </button>
          )}
          <StatusBadge status={task.status} />
        </div>
      </div>
      {task.description && (
        <p className="text-[11px] py-1.5 2xl:text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap line-clamp-5">
          {task.description}
        </p>
      )}
      {task.ticket && task.ticket.trim() && (
        <span
          className="inline-flex items-center gap-1 mb-1 rounded bg-muted px-2 py-0.5 font-mono text-[10px] 2xl:text-xs max-w-full truncate"
          title={task.ticket}
        >
          # {task.ticket}
        </span>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] 2xl:text-xs text-muted-foreground">
        {task.assignedTo &&
          typeof task.assignedTo === "object" &&
          task.assignedTo.name && (
            <span className="truncate">@{task.assignedTo.name}</span>
          )}
        {task.category && <span className="capitalize">{task.category}</span>}
        {due && (
          <span className={cn(overdue && "text-rose-500 font-medium")}>
            Due {due.toLocaleDateString()}
          </span>
        )}
        {typeof task.daysRemaining === "number" && (
          <span className={cn(task.daysRemaining < 0 && "text-rose-500")}>
            {task.daysRemaining}d left
          </span>
        )}
      </div>
    </div>
  );
}

export default TaskRow;
