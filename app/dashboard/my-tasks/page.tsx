import { createClient } from "@/libs/supabase/server";
import { getProfile } from "@/libs/supabase/getProfile";
import type { MyTaskActionItem, MyTaskRow } from "@/libs/taskSort";
import type { OrgMember } from "@/libs/orgMember";
import type { ActionItem } from "@/types/database";
import MyTasksClient from "./MyTasksClient";

export const dynamic = "force-dynamic";

type TaskQueryRow = Omit<MyTaskRow, "action_items">;

// "My tasks" across all projects (TSK-03). Quick check-off on the list;
// full editing on the task detail page or owning project.
export default async function MyTasksPage() {
  const profile = await getProfile();
  if (!profile?.id || !profile.org_id) return null;

  const supabase = await createClient();

  // !inner join on task_assignees filters tasks down to ones assigned to me.
  // Projects + members are loaded so a task can be created from this view.
  const [tasksRes, projectsRes, membersRes] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "id, name, status, due_date, project_id, projects(name), task_assignees!inner(profile_id)"
      )
      .eq("task_assignees.profile_id", profile.id)
      .order("due_date", { ascending: true }),
    supabase.from("projects").select("id, name").order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, email, is_external")
      .order("full_name"),
  ]);

  const { data } = tasksRes;

  const projects = (projectsRes.data as { id: string; name: string }[]) ?? [];
  const members: OrgMember[] = (
    (membersRes.data as Partial<OrgMember>[]) ?? []
  ).map((m) => ({
    id: m.id as string,
    full_name: m.full_name ?? null,
    email: m.email ?? null,
    is_external: m.is_external ?? false,
  }));

  const taskRows = (data as unknown as TaskQueryRow[]) ?? [];
  const taskIds = taskRows.map((t) => t.id);

  let actionItems: ActionItem[] = [];
  if (taskIds.length > 0) {
    const { data: itemsData } = await supabase
      .from("action_items")
      .select("id, task_id, title, is_complete, position")
      .in("task_id", taskIds)
      .order("position", { ascending: true });
    actionItems = (itemsData as ActionItem[]) ?? [];
  }

  const itemsByTask = new Map<string, MyTaskActionItem[]>();
  for (const item of actionItems) {
    const list = itemsByTask.get(item.task_id) ?? [];
    list.push({
      id: item.id,
      title: item.title,
      is_complete: item.is_complete,
      position: item.position,
    });
    itemsByTask.set(item.task_id, list);
  }

  const tasks: MyTaskRow[] = taskRows.map((task) => ({
    ...task,
    action_items: itemsByTask.get(task.id) ?? [],
  }));

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

        <MyTasksClient
          tasks={tasks}
          orgId={profile.org_id}
          currentUserId={profile.id}
          projects={projects}
          members={members}
        />
      </section>
    </main>
  );
}
