"use client";
import React, { useState, useMemo } from "react";
import { useAuth } from "../../../hooks/useAuth";
import useProjects from "../../../hooks/useProjects";
import {
  type FetchProjectsParams,
  type Project,
} from "../../../lib/api/projects";
import { cn } from "../../../lib/utils";
import { Card } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Loader2,
  Search,
  RefreshCcw,
  Users,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import AddNewProject from "@/components/shared/AddNewProject";

import EditProjectDialog from "@/components/shared/EditProjectDialog";
import { useRouter } from "next/navigation";

const statusColors: Record<Project["status"], string> = {
  active: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-gray-200 text-gray-600 border-gray-300",
};

const priorityColors: Record<Project["priority"], string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  urgent: "bg-red-50 text-red-700 border-red-200",
};

interface FilterState {
  search: string;
  status: "" | "active" | "completed" | "cancelled";
  priority: "" | "low" | "medium" | "high" | "urgent";
  page: number;
}

const defaultFilters: FilterState = {
  search: "",
  status: "",
  priority: "",
  page: 1,
};

const ProjectsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  // client-side filters (separate from server query filters)
  const [clientStatus, setClientStatus] = useState<FilterState["status"]>("");
  const [clientPriority, setClientPriority] =
    useState<FilterState["priority"]>("");
  const [clientSearch, setClientSearch] = useState("");

  const queryParams: FetchProjectsParams = useMemo(
    () => ({
      page: filters.page,
      limit: 12,
      search: filters.search || undefined,
      status: filters.status || undefined,
      priority: filters.priority || undefined,
    }),
    [filters]
  );

  const { data, isLoading, isFetching, error, refetch } =
    useProjects(queryParams);

  // Backend controller already scopes visible projects by role:
  // - user: only member projects
  // - moderator: created or member
  // - admin: all
  // So frontend only needs authentication gate.
  // Any authenticated user may view projects; backend scopes results based on role.

  const handleFilterChange = (patch: Partial<FilterState>) => {
    setFilters((prev) => ({
      ...prev,
      ...patch,
      page:
        patch.page ??
        (patch.search || patch.status || patch.priority ? 1 : prev.page),
    }));
  };

  const projects = React.useMemo(() => data?.projects ?? [], [data]);

  // client-side filtering logic
  const displayedProjects = useMemo(() => {
    return projects.filter((p) => {
      const statusMatch = clientStatus ? p.status === clientStatus : true;
      const priorityMatch = clientPriority
        ? p.priority === clientPriority
        : true;
      const searchText = clientSearch.trim().toLowerCase();
      const searchMatch = searchText
        ? p.title.toLowerCase().includes(searchText) ||
          p.description.toLowerCase().includes(searchText)
        : true;
      return statusMatch && priorityMatch && searchMatch;
    });
  }, [projects, clientStatus, clientPriority, clientSearch]);

  const anyClientFilter =
    clientStatus || clientPriority || clientSearch.trim().length > 0;

  const resetClientFilters = () => {
    setClientStatus("");
    setClientPriority("");
    setClientSearch("");
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Card className="p-8 flex flex-col items-center gap-4">
          <h2 className="text-2xl font-semibold">Authentication required</h2>
          <p className="text-muted-foreground">
            Please login to view projects.
          </p>
        </Card>
      </div>
    );
  }

  // (Removed Access Denied block: backend already enforces visibility.)

  const pagination = data?.pagination;

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage and monitor all workspace initiatives.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddNewProject />
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

      {/* Revamped Filters */}
      <Card className="p-4 space-y-4 border border-border/60 bg-gradient-to-br from-background to-muted/30">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
          <div className="w-full lg:flex-1">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1 block">
              Search
            </label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
              <Input
                placeholder="Search locally (title or description)..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9"
              />
              {clientSearch && (
                <button
                  type="button"
                  onClick={() => setClientSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </span>
              <div className="flex gap-2 flex-wrap">
                {["", "active", "completed", "cancelled"].map((val) => (
                  <button
                    key={val || "all"}
                    type="button"
                    onClick={() =>
                      setClientStatus(val as FilterState["status"])
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-md border text-xs font-medium transition",
                      clientStatus === val
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
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Priority
              </span>
              <div className="flex gap-2 flex-wrap">
                {["", "low", "medium", "high", "urgent"].map((val) => (
                  <button
                    key={val || "all"}
                    type="button"
                    onClick={() =>
                      setClientPriority(val as FilterState["priority"])
                    }
                    className={cn(
                      "px-3 py-1.5 rounded-md border text-xs font-medium transition",
                      clientPriority === val
                        ? "bg-secondary text-secondary-foreground border-secondary shadow-sm"
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
          <div className="text-xs text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {displayedProjects.length}
            </span>{" "}
            of {projects.length} fetched projects
            {anyClientFilter && <span> • filters applied</span>}
          </div>
          <div className="flex gap-2">
            {anyClientFilter && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={resetClientFilters}
              >
                Reset Filters
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

      {/* Content */}
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
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <div>
              <h3 className="font-semibold text-lg mb-1">
                Failed to load projects
              </h3>
              <p className="text-muted-foreground max-w-sm">{error.message}</p>
            </div>
            <Button onClick={() => refetch()}>Try Again</Button>
          </Card>
        ) : displayedProjects.length === 0 ? (
          <Card className="p-10 flex flex-col items-center gap-4 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center">
              <FolderIcon />
            </div>
            <h3 className="text-xl font-semibold">No projects match filters</h3>
            <p className="text-muted-foreground max-w-md">
              Adjust the client filters or sync to refetch server data.
            </p>
            {anyClientFilter && (
              <Button variant="outline" size="sm" onClick={resetClientFilters}>
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {displayedProjects.map((project) => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
            {/* Pagination (server-side) */}
            {pagination && (
              <div className="flex items-center justify-between pt-6">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages} •{" "}
                  {pagination.totalItems} total
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasPrevPage || filters.page === 1}
                    onClick={() =>
                      handleFilterChange({
                        page: Math.max(1, filters.page - 1),
                      })
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!pagination.hasNextPage}
                    onClick={() =>
                      handleFilterChange({ page: filters.page + 1 })
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  // const { user } = useAuth(); // ensure user role available
  const router = useRouter();
  const completion = project.completedTaskCount ?? 0;
  const total = project.taskCount ?? 0;
  const progress =
    total > 0 ? Math.round((completion / total) * 100) : undefined;
  const [editOpen, setEditOpen] = React.useState(false);
  // const canManage =
  //   user && (user.role === "admin" || user._id === project.createdBy._id);
  // const deleteMutation = useDeleteProject(project._id, {
  //   onSuccess: () => toast.success("Project deleted"),
  //   onError: (e) => toast.error(e.message),
  // });

  return (
    <Card
      className="p-5 flex flex-col gap-4 hover:shadow-md transition-shadow border border-border/50 cursor-pointer group"
      onClick={(e) => {
        // prevent clicks originating from interactive controls
        const target = e.target as HTMLElement;
        if (target.closest('button, a, [role="menuitem"], [data-interactive]'))
          return;
        router.push(`/projects/${project._id}`);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold capitalize text-lg leading-tight line-clamp-2 flex-1">
          {project.title}
        </h3>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full font-medium border",
              statusColors[project.status]
            )}
          >
            {project.status}
          </span>
          {/* {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-8 w-8 inline-flex items-center justify-center rounded-md border hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
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
                    if (
                      confirm("Delete this project? This cannot be undone.")
                    ) {
                      deleteMutation.mutate();
                    }
                  }}
                  className="flex items-center gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )} */}
        </div>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
        {project.description}
      </p>
      <div className="flex flex-wrap gap-2 text-xs">
        <span
          className={cn(
            "px-2 py-1 rounded-full border font-medium",
            priorityColors[project.priority]
          )}
        >
          {project.priority}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3" /> {project.teamMembers.length}
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
      {progress !== undefined && (
        <div className="w-full">
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
      <EditProjectDialog
        project={project}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </Card>
  );
};

const FolderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-7 w-7 text-muted-foreground"
  >
    <path d="M4 4h5l2 3h9v11a2 2 0 0 1-2 2H4Z" />
  </svg>
);

export default ProjectsPage;
