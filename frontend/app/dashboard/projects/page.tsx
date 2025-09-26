"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../lib/store/store";
import {
  fetchProjects,
  createProjectThunk,
  deleteProjectThunk,
} from "../../../lib/store/thunks/projectThunks";
import { Project } from "../../../lib/types/project";
import { notify } from "../../../lib/utils/toast";

// Quick utility components (could be extracted later)
const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
    {children}
  </span>
);

export default function ProjectsPage() {
  const dispatch = useDispatch<any>();
  const { projects, isLoading, error, pagination } = useSelector(
    (s: RootState) => s.projects
  );

  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "active",
  } as Partial<Project>);

  useEffect(() => {
    dispatch(fetchProjects({ page: 1, limit: 20 }))
      .unwrap()
      .catch(() => {});
  }, [dispatch]);

  const filtered = projects.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newProject.title?.trim()) return;
    try {
      const promise = dispatch(createProjectThunk(newProject as any)).unwrap();
      notify.promise(promise, {
        loading: "Creating project...",
        success: "Project created",
        error: "Failed to create project",
      });
      await promise;
      setShowNew(false);
      setNewProject({
        title: "",
        description: "",
        priority: "medium",
        status: "active",
      });
    } catch (e) {
      /* handled by toast */
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const promise = dispatch(deleteProjectThunk(id)).unwrap();
      notify.promise(promise, {
        loading: "Deleting...",
        success: "Deleted",
        error: "Delete failed",
      });
      await promise;
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm shadow-sm transition placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600 dark:focus:ring-slate-800 sm:w-64"
          />
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white shadow hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            New Project
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm dark:border-slate-800">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Title
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Priority
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Progress
              </th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
            {isLoading && projects.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-sm text-slate-500"
                >
                  Loading projects...
                </td>
              </tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-sm text-slate-500"
                >
                  No projects found
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr
                key={p._id}
                className="hover:bg-slate-50 dark:hover:bg-slate-900/40"
              >
                <td className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {p.title}
                </td>
                <td className="px-4 py-2">
                  <Badge>{p.status}</Badge>
                </td>
                <td className="px-4 py-2">
                  <Badge>{p.priority}</Badge>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full bg-slate-900 dark:bg-slate-300"
                        style={{ width: `${p.progress || 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {p.progress ?? 0}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="text-xs text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
            <span>{pagination.totalItems} total</span>
            <span>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
          </div>
        )}
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <h2 className="mb-4 text-lg font-semibold">New Project</h2>
            <div className="space-y-3">
              <input
                placeholder="Title"
                value={newProject.title}
                onChange={(e) =>
                  setNewProject((p) => ({ ...p, title: e.target.value }))
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600 dark:focus:ring-slate-800"
              />
              <textarea
                placeholder="Description"
                value={newProject.description}
                onChange={(e) =>
                  setNewProject((p) => ({ ...p, description: e.target.value }))
                }
                className="h-24 w-full resize-none rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600 dark:focus:ring-slate-800"
              />
              <div className="flex gap-3">
                <select
                  value={newProject.priority}
                  onChange={(e) =>
                    setNewProject((p) => ({
                      ...p,
                      priority: e.target.value as any,
                    }))
                  }
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600 dark:focus:ring-slate-800"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  value={newProject.status}
                  onChange={(e) =>
                    setNewProject((p) => ({
                      ...p,
                      status: e.target.value as any,
                    }))
                  }
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:border-slate-600 dark:focus:ring-slate-800"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowNew(false)}
                className="inline-flex h-8 items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newProject.title}
                className="inline-flex h-8 items-center justify-center rounded-md bg-slate-900 px-4 text-xs font-medium text-white shadow disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
