"use client";

import { useAuth } from "../../hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "../../components/dashboard/StatCard";
import {
  ActivityList,
  ActivityItemData,
} from "../../components/dashboard/ActivityList";
import { Icons } from "../../components/ui/icons";

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    projects: 0,
    tasks: 0,
    tickets: 0,
    members: 0,
  });
  const [activity, setActivity] = useState<ActivityItemData[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    // Placeholder: simulate fetching stats & activity
    if (isAuthenticated) {
      setLoadingStats(true);
      const timeout = setTimeout(() => {
        setStats({ projects: 12, tasks: 23, tickets: 8, members: 15 });
        setActivity([
          {
            id: "1",
            type: "task",
            title: 'Task "API Integration" marked done',
            meta: "by Sarah Chen",
            time: "2h ago",
          },
          {
            id: "2",
            type: "project",
            title: 'New project "Roadmap Q4" created',
            meta: "by You",
            time: "4h ago",
          },
          {
            id: "3",
            type: "ticket",
            title: "Ticket #104 escalated",
            meta: "priority: high",
            time: "6h ago",
          },
          {
            id: "4",
            type: "task",
            title: 'Task "UI Polish" moved to In Progress',
            meta: "by Alex M",
            time: "8h ago",
          },
          {
            id: "5",
            type: "user",
            title: "New member invited: Dana R.",
            meta: "role: moderator",
            time: "1d ago",
          },
        ]);
        setLoadingStats(false);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Icons.spinner className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground">
          Your productivity snapshot & recent team activity.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Projects"
          value={stats.projects}
          loading={loadingStats}
          icon={<Icons.projects className="w-5 h-5" />}
          trend={{ value: 8 }}
        />
        <StatCard
          label="Active Tasks"
          value={stats.tasks}
          loading={loadingStats}
          icon={<Icons.tasks className="w-5 h-5" />}
          trend={{ value: 12 }}
        />
        <StatCard
          label="Open Tickets"
          value={stats.tickets}
          loading={loadingStats}
          icon={<Icons.tickets className="w-5 h-5" />}
          trend={{ value: -3 }}
        />
        <StatCard
          label="Team Members"
          value={stats.members}
          loading={loadingStats}
          icon={<Icons.users className="w-5 h-5" />}
          trend={{ value: 2 }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              Recent Activity
            </h2>
          </div>
          <ActivityList items={activity} loading={loadingStats} />
        </div>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Quick Actions
          </h2>
          <div className="grid gap-3">
            <button className="text-left text-sm rounded-lg border px-4 py-3 hover:bg-muted/60 transition-colors font-medium">
              <span className="flex items-center gap-2">
                <Icons.plus className="w-4 h-4" /> New Project
              </span>
            </button>
            <button className="text-left text-sm rounded-lg border px-4 py-3 hover:bg-muted/60 transition-colors font-medium">
              <span className="flex items-center gap-2">
                <Icons.plus className="w-4 h-4" /> New Task
              </span>
            </button>
            <button className="text-left text-sm rounded-lg border px-4 py-3 hover:bg-muted/60 transition-colors font-medium">
              <span className="flex items-center gap-2">
                <Icons.plus className="w-4 h-4" /> New Ticket
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
