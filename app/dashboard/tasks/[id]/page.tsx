import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import TaskDetailClient from "./TaskDetailClient";
import type { ActionItem, Task } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: taskData } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const task = taskData as Task | null;
  if (!task) notFound();

  const [projectRes, membersRes, assigneesRes, actionItemsRes] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name")
        .eq("id", task.project_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name, email, is_external")
        .order("full_name"),
      supabase
        .from("task_assignees")
        .select("task_id, profile_id")
        .eq("task_id", task.id),
      supabase
        .from("action_items")
        .select("*")
        .eq("task_id", task.id)
        .order("position", { ascending: true }),
    ]);

  const project = projectRes.data as { id: string; name: string } | null;
  if (!project) notFound();

  return (
    <main className="min-h-screen p-6 pb-24 lg:p-8">
      <section className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link href="/dashboard/my-tasks" className="link link-hover text-sm">
            ← Tasks
          </Link>
        </div>

        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {task.name}
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Task detail — edit status, dates, assignees, and action items.
          </p>
        </div>

        <TaskDetailClient
          task={task}
          project={project}
          members={
            ((membersRes.data as {
              id: string;
              full_name: string | null;
              email: string | null;
              is_external: boolean;
            }[]) ?? []).map((m) => ({
              ...m,
              is_external: m.is_external ?? false,
            }))
          }
          initialAssignees={
            (assigneesRes.data as { task_id: string; profile_id: string }[]) ??
            []
          }
          initialActionItems={(actionItemsRes.data as ActionItem[]) ?? []}
        />
      </section>
    </main>
  );
}
