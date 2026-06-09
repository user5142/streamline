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
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Tasks</h1>
          <p className="text-sm text-base-content/70 mt-1">
            Tasks assigned to you across all projects.
          </p>
        </div>

        {tasks.length === 0 ? (
          <p className="text-sm text-base-content/60 py-6 text-center">
            You have no assigned tasks.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
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
