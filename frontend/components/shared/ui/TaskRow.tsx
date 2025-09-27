"use client";
import { ProjectTask } from '@/lib/api/projects'
import { cn } from '@/lib/utils'
import PriorityBadge from './PriorityBadge'
import StatusBadge from './StatusBadge'

export function TaskRow({ task }: { task: ProjectTask }) {
  const due = task.dueDate ? new Date(task.dueDate) : null
  const overdue = task.isOverdue
  return (
    <div className={cn('relative rounded-lg border bg-background/70 backdrop-blur-sm px-3 py-2 flex flex-col gap-1 hover:border-primary/40 transition-colors group', overdue && 'border-rose-500/50')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <PriorityBadge priority={task.priority} />
          <span className="font-medium text-xs truncate max-w-[200px] sm:max-w-[260px]">
            {task.title}
          </span>
        </div>
        <StatusBadge status={task.status} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
        {task.assignedTo?.name && (
          <span className="truncate">@{task.assignedTo.name}</span>
        )}
        {task.category && <span className="capitalize">{task.category}</span>}
        {due && (
          <span className={cn(overdue && 'text-rose-500 font-medium')}>
            Due {due.toLocaleDateString()}
          </span>
        )}
        {typeof task.daysRemaining === 'number' && (
          <span className={cn(task.daysRemaining < 0 && 'text-rose-500')}>{task.daysRemaining}d left</span>
        )}
      </div>
    </div>
  )
}

export default TaskRow
