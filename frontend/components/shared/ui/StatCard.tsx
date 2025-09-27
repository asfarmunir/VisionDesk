"use client";
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function StatCard({ label, value, icon, accent, className }: { label: string; value: ReactNode; icon?: ReactNode; accent?: string; className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl border bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm p-3 flex flex-col gap-1.5 group', className)}>
      {accent && <div className={cn('absolute inset-x-0 top-0 h-0.5', accent)} />}
      <div className="flex items-center gap-2 text-[11px] tracking-wide font-medium text-muted-foreground">
        {icon && <span className="h-4 w-4 text-muted-foreground/70">{icon}</span>}
        {label}
      </div>
      <div className="text-lg font-semibold leading-none tabular-nums">{value}</div>
    </div>
  )
}

export default StatCard
