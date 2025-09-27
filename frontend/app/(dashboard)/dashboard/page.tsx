"use client";
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import useDashboardAnalytics from "@/hooks/useDashboardAnalytics";
import useProjectCompletionTrend from "@/hooks/useProjectCompletionTrend";
import useTeamPerformance from "@/hooks/useTeamPerformance";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCcw,
  TrendingUp,
  Users,
  CheckCircle2,
  Clock,
} from "lucide-react";
import PriorityBadge from "@/components/shared/ui/PriorityBadge";
import StatusBadge from "@/components/shared/ui/StatusBadge";
//

const timeFrameOptions = [
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "90d", value: "90d" },
  { label: "1y", value: "1y" },
];

function SparkBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      )}
      <div className="h-2 w-full rounded bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-violet-600 transition-all"
          style={{ width: pct + "%" }}
        />
      </div>
    </div>
  );
}

function TrendMiniChart({
  points,
}: {
  points: { _id: string; completedProjects: number; averageProgress: number }[];
}) {
  if (!points.length)
    return <div className="text-[10px] text-muted-foreground">No data</div>;
  const maxCompleted = Math.max(...points.map((p) => p.completedProjects), 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {points.slice(-30).map((p) => {
        const h = (p.completedProjects / maxCompleted) * 100;
        return (
          <div
            key={p._id}
            className="w-1.5 bg-indigo-500/60 rounded"
            style={{ height: `${h}%` }}
            title={`${p._id}: ${p.completedProjects} completed`}
          />
        );
      })}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [timeFrame, setTimeFrame] = React.useState("30d");
  const {
    data: dashboard,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useDashboardAnalytics(timeFrame);
  const { data: trend } = useProjectCompletionTrend(30);
  useTeamPerformance({ timeFrame }); // prefetch for potential future expansion

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card className="p-8">
          <p className="text-sm">Please login.</p>
        </Card>
      </div>
    );
  }
  if (user?.role !== "admin") {
    return (
      <div className="p-6">
        <Card className="p-8 space-y-2">
          <h2 className="text-lg font-semibold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground">
            This dashboard is for administrators only.
          </p>
        </Card>
      </div>
    );
  }

  const proj = dashboard?.projects.stats;
  const tasks = dashboard?.tasks.stats;
  const approvals = dashboard?.approvals.stats;

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Operational overview and performance metrics
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            className="h-9 px-3 rounded-md border bg-background text-sm"
          >
            {timeFrameOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}{" "}
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <Card className="p-8 flex flex-col gap-4">
          <p className="text-sm font-medium">Failed to load analytics</p>
          <p className="text-xs text-muted-foreground">{error?.message}</p>
          <Button size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </Card>
      ) : dashboard ? (
        <>
          {/* KPI Row */}
          <div className="grid gap-4 md:grid-cols-3 2xl:grid-cols-6">
            <Card className="p-4 flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Projects
              </span>
              <div className="text-2xl font-bold">
                {proj?.totalProjects ?? 0}
              </div>
              <SparkBar
                value={proj?.completedProjects ?? 0}
                max={proj?.totalProjects || 1}
                label="Completed"
              />
            </Card>
            <Card className="p-4 flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Active
              </span>
              <div className="text-2xl font-bold">
                {proj?.activeProjects ?? 0}
              </div>
              <span className="text-[10px] text-muted-foreground">
                Avg Progress {Math.round(proj?.averageProgress || 0)}%
              </span>
            </Card>
            <Card className="p-4 flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Tasks
              </span>
              <div className="text-2xl font-bold">{tasks?.totalTasks ?? 0}</div>
              <span className="text-[10px] text-muted-foreground">
                Overdue {tasks?.overdueTasks ?? 0}
              </span>
            </Card>
            <Card className="p-4 flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                In Progress
              </span>
              <div className="text-2xl font-bold">
                {tasks?.inProgressTasks ?? 0}
              </div>
              <span className="text-[10px] text-muted-foreground">
                Open {tasks?.openTasks ?? 0}
              </span>
            </Card>
            <Card className="p-4 flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Awaiting Approval
              </span>
              <div className="text-2xl font-bold">
                {approvals?.closedPendingApproval ?? 0}
              </div>
              <span className="text-[10px] text-muted-foreground">
                Approved {approvals?.fullyApproved ?? 0}
              </span>
            </Card>
            <Card className="p-4 flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Throughput
              </span>
              <div className="text-2xl font-bold">
                {approvals?.totalClosedOrApproved ?? 0}
              </div>
              <span className="text-[10px] text-muted-foreground">
                Closed + Approved
              </span>
            </Card>
          </div>

          {/* Middle Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-5 flex flex-col gap-4 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" /> Project Trend
                </h2>
              </div>
              <div className="overflow-x-auto">
                <TrendMiniChart points={trend || []} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px]">
                {dashboard.projects.trend.slice(-4).map((t) => (
                  <div
                    key={t._id.date + t._id.status}
                    className="rounded-md bg-muted/40 p-2 flex flex-col gap-1"
                  >
                    <span className="font-medium">{t._id.status}</span>
                    <span className="text-muted-foreground">
                      {t.count} / {t._id.date}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5 flex flex-col gap-4">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Top Performers
              </h2>
              <div className="space-y-3 max-h-72 overflow-auto pr-1">
                {dashboard.userPerformance?.length ? (
                  dashboard.userPerformance.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate max-w-[140px]">
                          {u.userName || "Unknown"}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                          {u.userEmail}
                        </span>
                      </div>
                      <div className="text-right space-y-0.5">
                        <span className="block text-[10px]">
                          {Math.round(u.completionRate * 100)}% rate
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {u.completedTasks}/{u.totalTasks}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground">No data</p>
                )}
              </div>
            </Card>
          </div>

          {/* Bottom Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-5 flex flex-col gap-4 lg:col-span-2">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Recent Activity
              </h2>
              <div className="space-y-2 max-h-80 overflow-auto pr-1">
                {dashboard.recentActivities.length ? (
                  dashboard.recentActivities.map((a) => (
                    <div
                      key={a._id}
                      className="flex items-start justify-between gap-4 text-xs rounded-md border bg-background/70 backdrop-blur-sm p-2 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate max-w-[160px]">
                            {a.title}
                          </span>
                          <PriorityBadge
                            priority={
                              a.priority as "low" | "medium" | "high" | "urgent"
                            }
                          />
                          <StatusBadge
                            status={
                              a.status as
                                | "open"
                                | "in-progress"
                                | "closed"
                                | "approved"
                                | "cancelled"
                            }
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {a.projectTitle || "—"} •{" "}
                          {a.assignedUser || "Unassigned"}
                        </p>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {new Date(a.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    No recent updates
                  </p>
                )}
              </div>
            </Card>
            <Card className="p-5 flex flex-col gap-4">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Priority Distribution
              </h2>
              <div className="space-y-3">
                {Object.entries(dashboard.tasks.priorityDistribution).map(
                  ([prio, count]) => {
                    const max =
                      Math.max(
                        ...Object.values(dashboard.tasks.priorityDistribution)
                      ) || 1;
                    const pct = Math.round((count / max) * 100);
                    return (
                      <div key={prio} className="flex items-center gap-2">
                        <PriorityBadge
                          priority={
                            prio as "low" | "medium" | "high" | "urgent"
                          }
                        />
                        <div className="flex-1 h-2 bg-muted rounded overflow-hidden">
                          <div
                            className="h-full bg-indigo-500/70"
                            style={{ width: pct + "%" }}
                          />
                        </div>
                        <span className="text-[10px] w-6 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
