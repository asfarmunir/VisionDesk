import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../../lib/store";
import {
  fetchProjectById,
  updateProjectThunk,
  deleteProjectThunk,
} from "../../../../lib/store/thunks/projectThunks";
import { Project, ProjectTeamMember } from "../../../../lib/types/project";
import { notify } from "../../../../lib/utils/toast";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { currentProject, isLoading } = useSelector(
    (s: RootState) => s.projects
  );
  const id = params?.id;

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<
    Partial<
      Pick<
        Project,
        "title" | "description" | "status" | "priority" | "progress"
      >
    >
  >({});

  useEffect(() => {
    if (id) dispatch(fetchProjectById(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (currentProject) {
      setForm({
        title: currentProject.title,
        description: currentProject.description,
        status: currentProject.status,
        priority: currentProject.priority,
        progress: currentProject.progress,
      });
    }
  }, [currentProject]);

  const handleChange = <K extends keyof typeof form>(
    field: K,
    value: (typeof form)[K]
  ) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    if (!id) return;
    try {
      const promise = dispatch(updateProjectThunk({ id, data: form })).unwrap();
      notify.promise(promise, {
        loading: "Saving...",
        success: "Project updated",
        error: "Update failed",
      });
      await promise;
      setEditMode(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm("Delete this project? This cannot be undone.")) return;
    try {
      const promise = dispatch(deleteProjectThunk(id)).unwrap();
      notify.promise(promise, {
        loading: "Deleting...",
        success: "Deleted",
        error: "Delete failed",
      });
      await promise;
      router.push("/dashboard/projects");
    } catch {}
  };

  if (isLoading && !currentProject) {
    return <div className="p-6 text-sm text-slate-500">Loading project...</div>;
  }
  if (!currentProject) {
    return <div className="p-6 text-sm text-slate-500">Project not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        {!editMode ? (
          <h1 className="text-2xl font-semibold tracking-tight">
            {currentProject.title}
          </h1>
        ) : (
          <input
            value={form.title || ""}
            onChange={(e) => handleChange("title", e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-lg font-semibold focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600 dark:focus:ring-slate-800"
          />
        )}
        <div className="flex gap-2">
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="h-8 rounded-md bg-slate-900 px-3 text-xs font-medium text-white dark:bg-slate-100 dark:text-slate-900"
            >
              Edit
            </button>
          )}
          {editMode && (
            <>
              <button
                onClick={() => {
                  setEditMode(false);
                  setForm({});
                }}
                className="h-8 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium dark:border-slate-700 dark:bg-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="h-8 rounded-md bg-slate-900 px-3 text-xs font-medium text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
                disabled={!form.title}
              >
                Save
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="h-8 rounded-md bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-500"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Details
            </h2>
            {!editMode ? (
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {currentProject.description}
              </p>
            ) : (
              <textarea
                value={form.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                className="h-40 w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600 dark:focus:ring-slate-800"
              />
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Progress
            </h2>
            <div className="flex items-center gap-3">
              <div className="h-3 w-56 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full bg-slate-900 dark:bg-slate-300"
                  style={{ width: `${currentProject.progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {currentProject.progress}%
              </span>
            </div>
            {editMode && (
              <input
                type="range"
                min={0}
                max={100}
                value={form.progress ?? currentProject.progress}
                onChange={(e) =>
                  handleChange("progress", Number(e.target.value))
                }
                className="mt-3 w-56"
              />
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Meta
            </h2>
            <dl className="text-xs space-y-2">
              <div className="flex justify-between">
                <dt className="text-slate-500">Status</dt>
                <dd>
                  {!editMode ? (
                    currentProject.status
                  ) : (
                    <select
                      value={form.status}
                      onChange={(e) =>
                        handleChange(
                          "status",
                          e.target.value as Project["status"]
                        )
                      }
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="on-hold">On Hold</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Priority</dt>
                <dd>
                  {!editMode ? (
                    currentProject.priority
                  ) : (
                    <select
                      value={form.priority}
                      onChange={(e) =>
                        handleChange(
                          "priority",
                          e.target.value as Project["priority"]
                        )
                      }
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Created</dt>
                <dd>
                  {new Date(currentProject.createdAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Updated</dt>
                <dd>
                  {new Date(currentProject.updatedAt).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Owner</dt>
                <dd>{(currentProject.createdBy as { name?: string })?.name}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Team ({currentProject.teamMembers.length})
            </h2>
            <ul className="space-y-2 text-xs">
              {currentProject.teamMembers.map((m: ProjectTeamMember) => {
                const user = m.user as unknown as {
                  _id: string;
                  name?: string;
                };
                return (
                  <li key={user._id} className="flex justify-between">
                    <span>{user.name || "User"}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {m.role}
                    </span>
                  </li>
                );
              })}
              {currentProject.teamMembers.length === 0 && (
                <li className="text-slate-500">No team members</li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
