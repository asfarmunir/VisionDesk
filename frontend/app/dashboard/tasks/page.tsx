"use client";
import { useEffect, useState } from "react";
import {
  useAppDispatch,
  useAppSelector,
  type RootState,
} from "../../../lib/store";
import {
  fetchTasks,
  createTaskThunk,
  deleteTaskThunk,
} from "../../../lib/store/thunks/taskThunks";
import { CreateTaskData } from "../../../lib/api/tasks";

export default function TasksPage() {
  const dispatch = useAppDispatch();
  const { tasks, isLoading, error, pagination } = useAppSelector(
    (s: RootState) => s.tasks
  );
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Partial<CreateTaskData>>({
    title: "",
    description: "",
    projectId: "",
    assignedTo: "",
    dueDate: "",
  });

  useEffect(() => {
    dispatch(fetchTasks(undefined));
  }, [dispatch]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.title ||
      !form.description ||
      !form.projectId ||
      !form.assignedTo ||
      !form.dueDate
    )
      return;
    await dispatch(createTaskThunk(form as CreateTaskData));
    setShowCreate(false);
    setForm({
      title: "",
      description: "",
      projectId: "",
      assignedTo: "",
      dueDate: "",
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this task?")) {
      await dispatch(deleteTaskThunk(id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm"
        >
          New Task
        </button>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {isLoading && (
        <div className="text-sm text-gray-500">Loading tasks...</div>
      )}

      {!isLoading && tasks.length === 0 && (
        <div className="text-sm text-gray-500">No tasks found.</div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((t) => (
          <div
            key={t._id}
            className="border rounded p-4 bg-white shadow-sm flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <a
                href={`/dashboard/tasks/${t._id}`}
                className="font-medium line-clamp-1 hover:underline"
              >
                {t.title}
              </a>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 border">
                {t.status}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">
              {t.description}
            </p>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-400">
                {new Date(t.dueDate).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleDelete(t._id)}
                className="text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold">Create Task</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                name="title"
                placeholder="Title"
                value={form.title}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                name="projectId"
                placeholder="Project ID"
                value={form.projectId}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                name="assignedTo"
                placeholder="Assignee User ID"
                value={form.assignedTo}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-sm border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded disabled:opacity-50"
                  disabled={
                    !form.title ||
                    !form.description ||
                    !form.projectId ||
                    !form.assignedTo ||
                    !form.dueDate
                  }
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center gap-4 pt-4">
          <button
            disabled={pagination.currentPage === 1}
            className="text-sm px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-xs text-gray-500">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <button
            disabled={!pagination.hasNextPage}
            className="text-sm px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
