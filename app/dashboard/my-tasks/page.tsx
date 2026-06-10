import Link from "next/link";
import { createClient } from "@/libs/supabase/server";
import { getProfile } from "@/libs/supabase/getProfile";
import { taskStatusLabel, taskStatusBadgeClass } from "@/libs/status";

export const dynamic = "force-dynamic";

// "My tasks" across all projects (TSK-03). Read-only list; editing happens on
// the owning project's detail page.
type MyTask = {
  id: string;
  name: string;
  status: string;
  due_date: string | null;
  project_id: string;
  projects: { name: string } | null;
};

export default async function MyTasksPage() {
  const profile = await getProfile();
  if (!profile?.id) return null;

  const supabase = await createClient();

  // !inner join on task_assignees filters tasks down to ones assigned to me.
  const { data } = await supabase
    .from("tasks")
    .select("id, name, status, due_date, project_id, projects(name), task_assignees!inner(profile_id)")
    .eq("task_assignees.profile_id", profile.id)
    .order("due_date", { ascending: true });

  const tasks = (data as unknown as MyTask[]) ?? [];

  return (
    <main className="min-h-screen p-6 pb-24 lg:p-8">
      <section className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Tasks
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            Tasks assigned to you across all projects.
          </p>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold text-base-content">
              You&apos;re all clear
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-base-content/60">
              Tasks assigned to you will show up here once they&apos;re created
              on a project.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
            <table className="table">
              <thead className="bg-base-200 text-xs uppercase tracking-wide text-base-content/50">
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Due</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id} className="hover">
                    <td className="font-medium">{t.name}</td>
                    <td className="text-sm">
                      <Link
                        href={`/dashboard/projects/${t.project_id}`}
                        className="link link-hover"
                      >
                        {t.projects?.name ?? "—"}
                      </Link>
                    </td>
                    <td>
                      <span
                        className={`badge ${taskStatusBadgeClass(t.status)}`}
                      >
                        {taskStatusLabel(t.status)}
                      </span>
                    </td>
                    <td className="text-sm">
                      {t.due_date
                        ? new Date(t.due_date).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
