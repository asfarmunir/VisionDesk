"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useAppDispatch,
  useAppSelector,
  type RootState,
} from "../../../../lib/store";
import {
  fetchTaskById,
  updateTaskThunk,
  deleteTaskThunk,
} from "../../../../lib/store/thunks/taskThunks";
import { Task } from "../../../../lib/store/features/taskSlice";

export default function TaskDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const dispatch = useAppDispatch();
  const { currentTask, isLoading, error } = useAppSelector(
    (s: RootState) => s.tasks
  );
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState<Partial<Task>>({});

  useEffect(() => {
    if (id) dispatch(fetchTaskById(id));
  }, [id, dispatch]);

  useEffect(() => {
    if (currentTask) {
      setLocal({
        title: currentTask.title,
        description: currentTask.description,
        status: currentTask.status,
        priority: currentTask.priority,
        dueDate: currentTask.dueDate,
      });
    }
  }, [currentTask]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setLocal((l) => ({ ...l, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (!id) return;
    await dispatch(
      updateTaskThunk({
        id,
        data: {
          title: local.title!,
          description: local.description!,
          status: local.status as Task["status"],
          priority: local.priority as Task["priority"],
          dueDate: local.dueDate as string,
        },
      })
    );
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    if (confirm("Delete this task?")) {
      await dispatch(deleteTaskThunk(id));
      router.push("/dashboard/tasks");
    }
  };

  if (isLoading && !currentTask)
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (error && !currentTask)
    return <div className="p-6 text-sm text-red-600">{error}</div>;
  if (!currentTask)
    return <div className="p-6 text-sm text-gray-500">Task not found.</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        {editing ? (
          <input
            name="title"
            value={local.title || ""}
            onChange={handleChange}
            className="text-2xl font-semibold border-b outline-none"
          />
        ) : (
          <h1 className="text-2xl font-semibold">{currentTask.title}</h1>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setEditing((e) => !e)}
            className="px-3 py-1.5 text-sm border rounded"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm border rounded text-red-600"
          >
            Delete
          </button>
        </div>
      </div>
      <div className="flex gap-3 text-xs">
        <span className="px-2 py-0.5 rounded bg-gray-100 border">
          {currentTask.status}
        </span>
        <span className="px-2 py-0.5 rounded bg-gray-100 border">
          {currentTask.priority}
        </span>
        <span className="px-2 py-0.5 rounded bg-gray-100 border">
          Due {new Date(currentTask.dueDate).toLocaleDateString()}
        </span>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700">Description</h2>
        {editing ? (
          <textarea
            name="description"
            value={local.description || ""}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm min-h-[120px]"
          />
        ) : (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {currentTask.description}
          </p>
        )}
      </section>

      {editing && (
        <section className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Status</label>
              <select
                name="status"
                value={local.status}
                onChange={handleChange}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">Priority</label>
              <select
                name="priority"
                value={local.priority}
                onChange={handleChange}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Due Date</label>
            <input
              type="date"
              name="dueDate"
              value={local.dueDate?.slice(0, 10)}
              onChange={handleChange}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
            >
              Save Changes
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
