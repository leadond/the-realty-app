import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import TaskList, { type TaskItem } from "@/components/TaskList";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const tasks = await prisma.task.findMany({
    where: { userId: user.id },
    orderBy: [
      { isCompleted: "asc" },
      { dueDate: { sort: "asc", nulls: "last" } },
      { createdAt: "desc" },
    ],
  });

  const initialTasks: TaskItem[] = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    notes: task.notes,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    isCompleted: task.isCompleted,
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    createdAt: task.createdAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-5 py-6 text-[#17201b] md:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-[#d8d1c2] pb-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#365d52]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal">Tasks</h1>
          <p className="mt-1 text-sm text-[#58665e]">
            Keep track of everything on your plate. Incomplete tasks stay on top.
          </p>
        </header>

        <div className="mt-6">
          <TaskList initialTasks={initialTasks} />
        </div>
      </div>
    </main>
  );
}
