import { createClient } from "@/libs/supabase/server";
import { getProfile } from "@/libs/supabase/getProfile";
import type { MyTaskRow } from "@/libs/taskSort";
import MyTasksClient from "./MyTasksClient";

export const dynamic = "force-dynamic";

// "My tasks" across all projects (TSK-03). Read-only list; editing happens on
// the owning project's detail page.
export default async function MyTasksPage() {
  const profile = await getProfile();
  if (!profile?.id) return null;

  const supabase = await createClient();

  // !inner join on task_assignees filters tasks down to ones assigned to me.
  const { data } = await supabase
    .from("tasks")
    .select(
      "id, name, status, due_date, project_id, projects(name), task_assignees!inner(profile_id)"
    )
    .eq("task_assignees.profile_id", profile.id)
    .order("due_date", { ascending: true });

  const tasks = (data as unknown as MyTaskRow[]) ?? [];

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

        <MyTasksClient tasks={tasks} />
      </section>
    </main>
  );
}
