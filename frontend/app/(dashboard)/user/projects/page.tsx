"use client";
import React, { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProjectsWithTasks } from "@/hooks/useUserProjectsWithTasks";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  RefreshCcw,
  Users,
  CheckCircle2,
  Play,
  Flag,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Reuse colors logic from main projects page (could be centralized later)
const statusColors: Record<string, string> = {
  active:
    "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  completed:
    "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30",
  cancelled:
    "bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-500/15 dark:text-gray-300 dark:border-gray-500/30",
};
const priorityColors: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  medium:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  high: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  urgent:
    "bg-red-50 text-red-700  border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30",
};

const UserProjectsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isFetching, refetch, error } =
    useUserProjectsWithTasks();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );

  // Only keep projects where current user is in teamMembers or createdBy
  // Backend already filters by membership and returns only necessary fields
  const memberProjects = useMemo(() => data?.projects ?? [], [data?.projects]);

  const displayed = useMemo(() => {
    return memberProjects.filter((p) => {
      const statusOk = status ? p.status === status : true;
      const priorityOk = priority ? p.priority === priority : true;
      const searchText = search.trim().toLowerCase();
      const searchOk = searchText
        ? p.title.toLowerCase().includes(searchText) ||
          p.description.toLowerCase().includes(searchText)
        : true;
      return statusOk && priorityOk && searchOk;
    });
  }, [memberProjects, status, priority, search]);

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card className="p-8 flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold">Authentication required</h2>
          <p className="text-muted-foreground">
            Please login to view your projects.
          </p>
        </Card>
      </div>
    );
  }

  const selectedProject = selectedProjectId
    ? memberProjects.find((p) => p._id === selectedProjectId) || null
    : null;

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {selectedProject ? (
            <>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <button
                  onClick={() => setSelectedProjectId(null)}
                  className="text-sm px-2 py-1 rounded-md border bg-background hover:bg-muted transition"
                  aria-label="Back to projects"
                >
                  ← Back
                </button>
                <span className="line-clamp-1">{selectedProject.title}</span>
              </h1>
              <p className="text-muted-foreground max-w-3xl whitespace-pre-line mt-2 text-sm">
                {selectedProject.description}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
              <p className="text-muted-foreground">
                Projects you created or are a member of.
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </header>

      {!selectedProject && (
        <Card className="p-4 space-y-4 border border-border/60 bg-gradient-to-br from-background to-muted/30">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
            <div className="w-full lg:flex-1">
              <label className="text-xs 2xl:text-sm font-medium uppercase tracking-wide text-muted-foreground mb-1 block">
                Search
              </label>
              <div className="relative group">
                <Input
                  placeholder="Search within your projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-3"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs 2xl:text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <div className="space-y-2">
                <span className="text-xs 2xl:text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Status
                </span>
                <div className="flex gap-2 flex-wrap">
                  {["", "active", "completed", "cancelled"].map((val) => (
                    <button
                      key={val || "all"}
                      type="button"
                      onClick={() => setStatus(val)}
                      className={cn(
                        "px-3 py-1.5 rounded-md border text-xs 2xl:text-sm font-medium transition",
                        status === val
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      {val === ""
                        ? "All"
                        : val.charAt(0).toUpperCase() + val.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs 2xl:text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  Priority
                </span>
                <div className="flex gap-2 flex-wrap">
                  {["", "low", "medium", "high", "urgent"].map((val) => (
                    <button
                      key={val || "all"}
                      type="button"
                      onClick={() => setPriority(val)}
                      className={cn(
                        "px-3 py-1.5 rounded-md border text-xs 2xl:text-sm font-medium transition",
                        priority === val
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      {val === ""
                        ? "All"
                        : val.charAt(0).toUpperCase() + val.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
            <div className="text-xs 2xl:text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {displayed.length}
              </span>{" "}
              of {memberProjects.length} projects
            </div>
            <div className="flex gap-2">
              {(status || priority || search) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatus("");
                    setPriority("");
                    setSearch("");
                  }}
                >
                  Reset
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCcw className="h-3 w-3" />
                )}
                <span className="ml-2">Sync</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="min-h-[300px]">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-4 animate-pulse space-y-4">
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-5/6" />
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-8 bg-muted rounded w-full" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <Card className="p-8 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Failed to load</h3>
            <p className="text-muted-foreground max-w-sm">{error.message}</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </Card>
        ) : selectedProject ? (
          <ProjectTasksView
            project={selectedProject}
            onBack={() => setSelectedProjectId(null)}
          />
        ) : displayed.length === 0 ? (
          <Card className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              😶‍🌫️
            </div>
            <h3 className="text-xl font-semibold">No matching projects</h3>
            <p className="text-muted-foreground max-w-md">
              Adjust filters or create / join a project.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayed.map((p) => (
              <MemberProjectCard
                key={p._id}
                project={p}
                onToggle={() => setSelectedProjectId(p._id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import type { UserProjectWithTasks, UserProjectTask } from "@/lib/api/projects";
import { useUpdateTask } from "@/hooks/useUpdateTask";
interface MemberCardProps {
  project: UserProjectWithTasks;
  onToggle: () => void;
}

const MemberProjectCard: React.FC<MemberCardProps> = ({
  project,
  onToggle,
}) => {
  const completion = project.completedTaskCount ?? 0;
  const total = project.tasks.length ?? 0;
  const progress = total > 0 ? Math.round((completion / total) * 100) : 0;
  return (
    <Card className="p-0 flex flex-col border border-border/50 overflow-hidden group">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "text-left p-5 flex flex-col gap-4 transition-colors",
          "hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold capitalize text-lg leading-tight line-clamp-2 flex-1">
            {project.title}
          </h3>
          <span
            className={cn(
              "text-xs 2xl:text-sm px-2 py-1 rounded-full font-medium border",
              statusColors[project.status]
            )}
          >
            {project.status}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 text-xs 2xl:text-sm">
          <span
            className={cn(
              "px-2 py-1 rounded-full border font-medium",
              priorityColors[project.priority]
            )}
          >
            {project.priority}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs 2xl:text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {/* team size unknown here */}
          </span>
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> {completion}/{total}
          </span>
          {project.completedDate && (
            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3" /> Done
            </span>
          )}
        </div>
        <div className="flex justify-between items-center text-[11px] text-muted-foreground">
          <span>{new Date(project.createdAt).toLocaleDateString()}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              progress === 100 ? "bg-green-500" : "bg-blue-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </button>
    </Card>
  );
};

const TaskList: React.FC<{ tasks: UserProjectTask[] }> = ({ tasks }) => {
  const { mutate: updateTask, isPending: isUpdating } = useUpdateTask();
  const [closingTaskId, setClosingTaskId] = React.useState<string | null>(null);
  const [ticketText, setTicketText] = React.useState("");

  const startTask = (task: UserProjectTask) => {
    if (task.status !== "open") return;
    updateTask({ id: task._id, data: { status: "in-progress" } });
  };

  const closeTask = (task: UserProjectTask) => {
    // require ticket text
    if (!ticketText.trim()) return;
    updateTask(
      { id: task._id, data: { status: "closed", ticket: ticketText.trim() } },
      {
        onSuccess: () => {
          setClosingTaskId(null);
          setTicketText("");
        },
      }
    );
  };

  if (!tasks.length) {
    return (
      <div className="p-4 text-xs 2xl:text-sm text-muted-foreground italic flex items-center gap-2">
        <span>No tasks assigned to you in this project.</span>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border/40">
      {tasks.map((t) => (
        <li key={t._id} className="p-3 text-xs 2xl:text-sm flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-lg text-foreground line-clamp-1">
                {t.title}
              </p>
              <p className="py-1.5 text-foreground max-w-7xl ">
                {t.description}
              </p>
            </div>
            <div className="flex flex-col gap-2 items-end min-w-[130px]">
              <span
                className={cn(
                  "w-32 text-nowrap text-center capitalize py-1 rounded-full border text-xs font-medium",
                  priorityColors[t.priority]
                )}
              >
                {t.priority}
              </span>
              <span
                className={cn(
                  "w-32 text-nowrap text-center capitalize  py-1 rounded-full border text-xs ",
                  statusColors[t.status] || "bg-muted text-foreground"
                )}
              >
                {t.status}
              </span>
              {/* Actions */}
              {t.status === "open" && (
                <button
                  disabled={isUpdating}
                  onClick={() => startTask(t)}
                  className="text-[10px] flex items-center gap-1 px-2 py-1 rounded border bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  Start
                </button>
              )}
              {t.status === "in-progress" &&
                (closingTaskId === t._id ? (
                  <div className="w-full space-y-2">
                    <textarea
                      autoFocus
                      placeholder="Add ticket / closing notes"
                      value={ticketText}
                      onChange={(e) => setTicketText(e.target.value)}
                      className="w-full h-16 text-[10px] rounded border bg-background p-1 resize-none"
                    />
                    <div className="flex gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setClosingTaskId(null);
                          setTicketText("");
                        }}
                        className="px-2 py-1 text-[10px] rounded border hover:bg-muted"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!ticketText.trim() || isUpdating}
                        onClick={() => closeTask(t)}
                        className="px-2 py-1 text-[10px] rounded border bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 flex items-center gap-1"
                      >
                        {isUpdating ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : (
                          <Flag className="h-3 w-3" />
                        )}
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    disabled={isUpdating}
                    onClick={() => setClosingTaskId(t._id)}
                    className="text-[10px] flex items-center gap-1 px-2 py-1 rounded border bg-amber-600 text-white hover:bg-amber-500 disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <Loader className="h-3 w-3 animate-spin" />
                    ) : (
                      <Flag className="h-3 w-3" />
                    )}
                    Close Task
                  </button>
                ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
            {t.dueDate && (
              <span className="text-[10px]">
                Due {new Date(t.dueDate).toLocaleDateString()}
              </span>
            )}
            {t.ticket && (
              <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">
                {t.ticket}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

interface ProjectTasksViewProps {
  project: UserProjectWithTasks;
  onBack: () => void;
}

const ProjectTasksView: React.FC<ProjectTasksViewProps> = ({ project }) => {
  const completion = project.completedTaskCount ?? 0;
  const total = project.tasks.length ?? 0;
  const progress = total > 0 ? Math.round((completion / total) * 100) : 0;
  return (
    <div className="space-y-6">
      <Card className="p-6 border border-border/60">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs 2xl:text-sm">
            <span
              className={cn(
                "px-2 py-1 rounded-full border font-medium",
                statusColors[project.status]
              )}
            >
              {project.status}
            </span>
            <span
              className={cn(
                "px-2 py-1 rounded-full border font-medium",
                priorityColors[project.priority]
              )}
            >
              {project.priority}
            </span>
            <span className="px-2 py-1 rounded-full border bg-muted text-muted-foreground font-medium">
              Tasks {completion}/{total}
            </span>
            <span className="px-2 py-1 rounded-full border bg-muted text-muted-foreground font-medium">
              Progress {progress}%
            </span>
          </div>
          <div className="h-2 rounded bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                progress === 100 ? "bg-green-500" : "bg-blue-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[11px] text-muted-foreground flex gap-4 flex-wrap">
            <span>
              Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
            {project.startDate && (
              <span>
                Started {new Date(project.startDate).toLocaleDateString()}
              </span>
            )}
            {project.completedDate && (
              <span>
                Completed {new Date(project.completedDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </Card>
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/40 flex items-center justify-between bg-muted/30">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Your Tasks ({project.tasks.length})
          </h2>
        </div>
        <TaskList tasks={project.tasks} />
      </Card>
    </div>
  );
};

export default UserProjectsPage;
