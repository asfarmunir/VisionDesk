"use client";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import useProject from "@/hooks/useProject";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowLeft,
  Pencil,
  Trash2,
  Users,
  CheckCircle2,
} from "lucide-react";
import EditProjectDialog from "@/components/shared/EditProjectDialog";
import useDeleteProject from "@/hooks/useDeleteProject";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { IoMdAdd } from "react-icons/io";
import AddTeamMember from "@/components/shared/AddTeamMember";
import AddTaskDialog from "@/components/shared/AddTaskDialog";
import StatusBadge from "@/components/shared/ui/StatusBadge";
import PriorityBadge from "@/components/shared/ui/PriorityBadge";
import RoleBadge from "@/components/shared/ui/RoleBadge";
import StatCard from "@/components/shared/ui/StatCard";
import TaskRow from "@/components/shared/ui/TaskRow";
// (Style maps from legacy version removed – handled by new badge components)

export default function ProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  console.log("🚀 ~ ProjectDetailsPage ~ project:", project);
  const deleteMutation = useDeleteProject(id || "", {
    onSuccess: () => {
      toast.success("Project deleted");
      router.push("/projects");
    },
    onError: (e) => toast.error(e.message),
  });
  const [editOpen, setEditOpen] = React.useState(false);
  const [addMemberOpen, setAddMemberOpen] = React.useState(false);
  const [addTaskOpen, setAddTaskOpen] = React.useState(false);

  const completion = project?.completedTaskCount ?? 0;
  const total = project?.taskCount ?? 0;
  const derivedProgress =
    total > 0 ? Math.round((completion / total) * 100) : 0;
  const progress =
    typeof project?.progress === "number" ? project.progress! : derivedProgress;
  const canManage = !!(
    project &&
    user &&
    (user.role === "admin" || user._id === project.createdBy._id)
  );

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

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-60 bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-violet-700 opacity-90 blur-[1px]" />
      <div className="relative px-6 pt-6 pb-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>
              <span className="text-xs 2xl:text-sm text-white/60">
                ID: {project._id.slice(-8)}
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
              {project.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
              <span className="text-[11px] text-white/70">
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
              {project.completedDate && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-200">
                  <CheckCircle2 className="h-3 w-3" /> Completed{" "}
                  {new Date(project.completedDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          {canManage && (
            <div className="flex gap-2 self-start xl:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
                className="backdrop-blur-sm bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  if (confirm("Delete this project? This cannot be undone."))
                    deleteMutation.mutate();
                }}
                className="bg-rose-600/80 hover:bg-rose-600 text-white border border-rose-300/30"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Tasks"
            value={total}
            accent="bg-gradient-to-r from-indigo-400/70 to-transparent"
          />
          <StatCard
            label="Completed"
            value={completion}
            accent="bg-gradient-to-r from-emerald-400/70 to-transparent"
          />
          <StatCard
            label="Open %"
            value={`${
              total ? Math.round(((total - completion) / total) * 100) : 0
            }%`}
            accent="bg-gradient-to-r from-blue-400/70 to-transparent"
          />
          <StatCard
            label="Team Members"
            value={project.teamMembers?.length || 0}
            accent="bg-gradient-to-r from-fuchsia-400/70 to-transparent"
          />
          <StatCard
            label="Start"
            value={new Date(
              project.startDate || project.createdAt
            ).toLocaleDateString()}
            accent="bg-gradient-to-r from-amber-400/70 to-transparent"
          />
          <StatCard
            label="Progress"
            value={`${progress}%`}
            accent="bg-gradient-to-r from-cyan-400/70 to-transparent"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="relative overflow-hidden border-white/10 bg-background/70 backdrop-blur-sm p-6 space-y-5">
              <div className="space-y-4">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                  Overview
                </h2>
                <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground/90">
                  {project.description}
                </p>
                {Array.isArray(project.tags) && project.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-gradient-to-r from-slate-700/40 to-slate-800/40 dark:from-slate-100/10 dark:to-slate-100/5 border border-white/10 backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {progress !== undefined && (
                  <div className="pt-2">
                    <div className="flex justify-between text-[11px] mb-1 text-muted-foreground">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 rounded bg-muted/40 overflow-hidden ring-1 ring-inset ring-white/10">
                      <div
                        className={cn(
                          "h-full transition-all duration-500",
                          progress === 100
                            ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                            : "bg-gradient-to-r from-indigo-400 via-fuchsia-500 to-violet-600"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Tasks */}
            <Card className="border-white/10 bg-background/70 backdrop-blur-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                  Tasks
                </h2>
                {canManage && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 border-primary/40 hover:bg-primary/10"
                    onClick={() => setAddTaskOpen(true)}
                  >
                    <IoMdAdd className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {Array.isArray(project.tasks) && project.tasks.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-auto pr-1">
                  {project.tasks.map(
                    (t: import("@/lib/api/projects").ProjectTask) => (
                      <TaskRow key={t._id} task={t} />
                    )
                  )}
                </div>
              ) : (
                <p className="text-xs 2xl:text-sm text-muted-foreground">
                  No tasks linked yet.
                </p>
              )}
            </Card>
          </div>
          <div className="space-y-6">
            {/* Team */}
            <Card className="p-6 border-white/10 bg-background/70 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                  Team
                </h2>
                {canManage && (
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 border-primary/40 hover:bg-primary/10"
                    onClick={() => setAddMemberOpen(true)}
                  >
                    <IoMdAdd className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-between text-xs 2xl:text-sm">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" /> Members
                </span>
                <span className="font-medium">
                  {project.teamMembers?.length || 0}
                </span>
              </div>
              {Array.isArray(project.teamMembers) &&
              project.teamMembers.length > 0 ? (
                <ul className="space-y-2">
                  {project.teamMembers.map((tm) => (
                    <li
                      key={tm.user._id}
                      className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2 text-xs 2xl:text-sm border border-white/10"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-medium truncate max-w-[150px]">
                          {tm.user.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {tm.user.email}
                        </span>
                      </div>
                      <RoleBadge role={tm.role} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs 2xl:text-sm text-muted-foreground">
                  No team members yet.
                </p>
              )}
            </Card>
          </div>
        </div>

        {/* Dialogs */}
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
        {canManage && (
          <AddTaskDialog
            project={project}
            open={addTaskOpen}
            onOpenChange={setAddTaskOpen}
          />
        )}
      </div>
    </div>
  );
}
