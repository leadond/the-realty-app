"use client";

import { useState } from "react";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";

export type TaskItem = {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  isCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
};

type ApiResult = { ok: true; task: TaskItem } | { ok: false; error: string };

function sortTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function formatDueDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TaskList({ initialTasks }: { initialTasks: TaskItem[] }) {
  const [tasks, setTasks] = useState<TaskItem[]>(sortTasks(initialTasks));
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  function setPending(id: string, pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          notes: notes.trim() || undefined,
          dueDate: dueDate || undefined,
        }),
      });
      const result: ApiResult = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.ok ? "Could not save task" : result.error);
      }
      setTasks((prev) => sortTasks([...prev, result.task]));
      setTitle("");
      setNotes("");
      setDueDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save task");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggle(task: TaskItem) {
    setPending(task.id, true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted: !task.isCompleted }),
      });
      const result: ApiResult = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.ok ? "Could not update task" : result.error);
      }
      setTasks((prev) => sortTasks(prev.map((item) => (item.id === task.id ? result.task : item))));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update task");
    } finally {
      setPending(task.id, false);
    }
  }

  async function handleDelete(id: string) {
    setPending(id, true);
    setError(null);
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Could not delete task");
      }
      setTasks((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete task");
      setPending(id, false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleAdd}
        className="rounded-md border border-[#d8d1c2] bg-white p-4"
        aria-label="Add task"
      >
        <div className="flex flex-col gap-3">
          <label className="text-xs font-semibold uppercase text-[#6b4f2a]" htmlFor="task-title">
            New task
          </label>
          <input
            id="task-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What needs doing?"
            required
            className="h-10 rounded-md border border-[#d8d1c2] bg-white px-3 text-sm text-[#17201b] placeholder:text-[#8a9389] focus:border-[#17453b] focus:outline-none focus:ring-2 focus:ring-[#17453b]/20"
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="task-notes"
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes (optional)"
              aria-label="Notes"
              className="h-10 flex-1 rounded-md border border-[#d8d1c2] bg-white px-3 text-sm text-[#17201b] placeholder:text-[#8a9389] focus:border-[#17453b] focus:outline-none focus:ring-2 focus:ring-[#17453b]/20"
            />
            <input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              aria-label="Due date"
              className="h-10 rounded-md border border-[#d8d1c2] bg-white px-3 text-sm text-[#17201b] focus:border-[#17453b] focus:outline-none focus:ring-2 focus:ring-[#17453b]/20"
            />
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#17453b] px-4 text-sm font-semibold text-white disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Plus size={16} aria-hidden="true" />
              )}
              Add
            </button>
          </div>
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-md border border-[#e0b4a4] bg-[#faf0eb] px-4 py-3 text-sm text-[#8a3a24]">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-md border border-[#d8d1c2] bg-white">
        {tasks.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-[#58665e]">
            No tasks yet. Add your first one above.
          </p>
        ) : (
          <ul className="divide-y divide-[#e3dccf]">
            {tasks.map((task) => {
              const isPending = pendingIds.has(task.id);
              return (
                <li key={task.id} className="flex items-start gap-3 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleToggle(task)}
                    disabled={isPending}
                    aria-pressed={task.isCompleted}
                    aria-label={task.isCompleted ? "Mark task incomplete" : "Mark task complete"}
                    className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border ${
                      task.isCompleted
                        ? "border-[#17453b] bg-[#17453b] text-white"
                        : "border-[#b8ad99] bg-white text-transparent"
                    } disabled:opacity-50`}
                  >
                    <Check size={14} aria-hidden="true" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-medium ${
                        task.isCompleted ? "text-[#8a9389] line-through" : "text-[#17201b]"
                      }`}
                    >
                      {task.title}
                    </p>
                    {task.notes && <p className="mt-1 text-sm text-[#58665e]">{task.notes}</p>}
                    {task.dueDate && (
                      <p className="mt-1 text-xs font-semibold uppercase text-[#6b4f2a]">
                        Due {formatDueDate(task.dueDate)}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(task.id)}
                    disabled={isPending}
                    aria-label="Delete task"
                    className="flex-none rounded-md p-2 text-[#8a3a24] hover:bg-[#faf0eb] disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 size={16} aria-hidden="true" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
