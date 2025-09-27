"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import useProject from "@/hooks/useProject";
import { ProjectTask } from "@/lib/api/projects";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
} from "lucide-react";
import EditProjectDialog from "@/components/shared/EditProjectDialog";
import useDeleteProject from "@/hooks/useDeleteProject";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { IoMdAdd } from "react-icons/io";
import AddTeamMember from "@/components/shared/AddTeamMember";
const statusStyles: Record<string, string> = {
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-200 text-gray-600 border-gray-300",
};

const priorityStyles: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const [editOpen, setEditOpen] = React.useState(false);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);

  const canManage =
    project &&
    user &&
    (user.role === "admin" || user._id === project.createdBy._id);
  const deleteMutation = useDeleteProject(id || "", {
    onSuccess: () => {
      toast.success("Project deleted");
      router.push("/projects");
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card className="p-8 flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold">Authentication required</h2>
          <p className="text-muted-foreground">
            Please login to view this project.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="p-10 flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading project...</p>
        </Card>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="p-6 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Card className="p-10 flex flex-col items-center gap-4 text-center">
          <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">Project not found</h3>
          <p className="text-muted-foreground max-w-md">
            {error?.message ||
              "The project may have been removed or you lack permissions."}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
            <Button size="sm" onClick={() => router.push("/projects")}>
              All Projects
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const completion = project.completedTaskCount ?? 0;
  const total = project.taskCount ?? 0;
  // Prefer backend-provided progress if exists (allows server logic overrides)
  const derivedProgress =
    total > 0 ? Math.round((completion / total) * 100) : 0;
  const progress =
    typeof project.progress === "number" ? project.progress : derivedProgress;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
        </div>
        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-9 w-9 inline-flex items-center justify-center rounded-md border hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => setEditOpen(true)}
                className="flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  if (confirm("Delete this project? This cannot be undone.")) {
                    deleteMutation.mutate();
                  }
                }}
                className="flex items-center gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium border",
                  statusStyles[project.status]
                )}
              >
                {project.status}
              </span>
              <span
                className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium border",
                  priorityStyles[project.priority]
                )}
              >
                {project.priority}
              </span>
              <span className="text-xs text-muted-foreground">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
              {project.completedDate && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-3 w-3" /> Completed{" "}
                  {new Date(project.completedDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed whitespace-pre-line">
              {project.description}
            </p>
            {Array.isArray(project.tags) && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-md bg-muted text-xs font-medium border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {progress !== undefined && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Progress</span>
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
              </div>
            )}
          </Card>
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Tasks
              </h2>
              <Button>Add Task</Button>
            </div>
            {Array.isArray(project.tasks) && project.tasks.length > 0 ? (
              <ul className="space-y-2 max-h-64 overflow-auto pr-1">
                {project.tasks.map((t: ProjectTask) => (
                  <li
                    key={t._id}
                    className="flex items-center justify-between rounded border bg-background px-3 py-2 text-xs"
                  >
                    <span className="truncate font-medium max-w-[220px]">
                      {t.title || "Untitled Task"}
                    </span>
                    {t.status && (
                      <span className="ml-2 text-muted-foreground capitalize">
                        {t.status}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                No tasks linked yet.
              </p>
            )}
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                Team
              </h2>
              {canManage && (
                <button
                  onClick={() => setAddMemberOpen(true)}
                  className="rounded-full bg-primary px-2 py-2 text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <IoMdAdd size={16} />
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" /> Members
                </span>
                <span className="font-medium">
                  {Array.isArray(project.teamMembers)
                    ? project.teamMembers.length
                    : 0}
                </span>
              </div>
              {Array.isArray(project.teamMembers) &&
              project.teamMembers.length > 0 ? (
                <ul className="space-y-2">
                  {project.teamMembers.map((tm) => (
                    <li
                      key={tm.user._id}
                      className="flex items-center justify-between text-xs bg-muted/40 px-2 py-1 rounded"
                    >
                      <span className="truncate max-w-[140px]">
                        {tm.user.name}
                      </span>
                      <span className="text-muted-foreground">{tm.role}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No team members yet.
                </p>
              )}
            </div>
          </Card>
          <Card className="p-6 space-y-3">
            <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Statistics
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded border bg-background">
                <div className="text-muted-foreground mb-1">Tasks</div>
                <div className="font-semibold">{total}</div>
              </div>
              <div className="p-3 rounded border bg-background">
                <div className="text-muted-foreground mb-1">Completed</div>
                <div className="font-semibold">{completion}</div>
              </div>
              <div className="p-3 rounded border bg-background col-span-2">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">{progress ?? 0}%</span>
                </div>
                <div className="h-2 rounded bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      progress === 100 ? "bg-green-500" : "bg-blue-500"
                    )}
                    style={{ width: `${progress ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <EditProjectDialog
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      {canManage && (
        <AddTeamMember
          projectId={project._id}
          open={addMemberOpen}
          onOpenChange={setAddMemberOpen}
        />
      )}
    </div>
  );
}
