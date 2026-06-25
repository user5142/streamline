import type { Project, Task } from "@/types/database";

export type ProjectAssignee = { task_id: string; profile_id: string };

// The set of project ids a person is "assigned" to: projects they own, plus
// any project containing a task they are assigned to. This is the shared
// definition of an assigned project used by the Gantt and Projects views.
export function assignedProjectIds(
  personId: string,
  projects: Project[],
  tasks: Task[],
  assignees: ProjectAssignee[]
): Set<string> {
  const ids = new Set<string>();

  projects.forEach((p) => {
    if (p.owner_id === personId) ids.add(p.id);
  });

  const taskById = new Map(tasks.map((t) => [t.id, t]));
  assignees
    .filter((a) => a.profile_id === personId)
    .forEach((a) => {
      const task = taskById.get(a.task_id);
      if (task) ids.add(task.project_id);
    });

  return ids;
}
