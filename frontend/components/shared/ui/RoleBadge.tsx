"use client";
import { cn } from '@/lib/utils'

const roleMap: Record<string, string> = {
  lead: 'bg-violet-500/15 text-violet-500 border-violet-500/30',
  developer: 'bg-indigo-500/15 text-indigo-500 border-indigo-500/30',
  tester: 'bg-lime-500/15 text-lime-600 border-lime-500/30 dark:text-lime-400',
  designer: 'bg-pink-500/15 text-pink-500 border-pink-500/30'
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <span className={cn('px-2 py-[2px] rounded-md border text-[10px] font-medium tracking-wide capitalize', roleMap[role] || 'bg-muted text-muted-foreground', className)}>{role}</span>
  )
}

export default RoleBadge
