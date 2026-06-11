import { memberDisplayLabel, type OrgMember } from "@/libs/orgMember";
import { TASK_STATUSES } from "@/libs/status";
import type { SortDirection } from "@/libs/projectSort";
import type { Task, TaskStatus } from "@/types/database";

export type { SortDirection };

export type TaskSortColumn =
  | "name"
  | "project"
  | "status"
  | "start_date"
  | "due_date"
  | "assignee";

export const MY_TASK_SORT_COLUMNS: {
  value: TaskSortColumn;
  label: string;
}[] = [
  { value: "name", label: "Task" },
  { value: "project", label: "Project" },
  { value: "status", label: "Status" },
  { value: "due_date", label: "Due" },
];

export const PROJECT_TASK_SORT_COLUMNS: {
  value: TaskSortColumn;
  label: string;
}[] = [
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
  { value: "start_date", label: "Start date" },
  { value: "due_date", label: "Due date" },
  { value: "assignee", label: "Assignee" },
];

const STATUS_SORT_ORDER = new Map(TASK_STATUSES.map((s, i) => [s.value, i]));

function compareStrings(a: string, b: string, dir: number): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" }) * dir;
}

function compareDates(
  a: string | null | undefined,
  b: string | null | undefined,
  dir: number
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return (new Date(a).getTime() - new Date(b).getTime()) * dir;
}

export interface MyTaskRow {
  id: string;
  name: string;
  status: TaskStatus;
  due_date: string | null;
  project_id: string;
  projects: { name: string } | null;
}

export function sortMyTasks(
  tasks: MyTaskRow[],
  sortColumn: TaskSortColumn,
  sortDirection: SortDirection
): MyTaskRow[] {
  const dir = sortDirection === "asc" ? 1 : -1;

  return [...tasks].sort((a, b) => {
    switch (sortColumn) {
      case "name":
        return compareStrings(a.name, b.name, dir);
      case "project":
        return compareStrings(
          a.projects?.name ?? "—",
          b.projects?.name ?? "—",
          dir
        );
      case "status": {
        const aOrder = STATUS_SORT_ORDER.get(a.status) ?? 999;
        const bOrder = STATUS_SORT_ORDER.get(b.status) ?? 999;
        return (aOrder - bOrder) * dir;
      }
      case "due_date":
        return compareDates(a.due_date, b.due_date, dir);
      default:
        return 0;
    }
  });
}

function assigneeSortLabel(
  members: OrgMember[],
  assigneeIds: string[]
): string {
  if (assigneeIds.length === 0) return "—";
  return assigneeIds
    .map((id) => {
      const m = members.find((x) => x.id === id);
      return m ? memberDisplayLabel(m) : "Unknown";
    })
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .join(", ");
}

export function sortProjectTasks(
  tasks: Task[],
  sortColumn: TaskSortColumn,
  sortDirection: SortDirection,
  members: OrgMember[],
  taskAssigneeIds: (taskId: string) => string[]
): Task[] {
  const dir = sortDirection === "asc" ? 1 : -1;

  return [...tasks].sort((a, b) => {
    switch (sortColumn) {
      case "name":
        return compareStrings(a.name, b.name, dir);
      case "status": {
        const aOrder = STATUS_SORT_ORDER.get(a.status) ?? 999;
        const bOrder = STATUS_SORT_ORDER.get(b.status) ?? 999;
        return (aOrder - bOrder) * dir;
      }
      case "start_date":
        return compareDates(a.start_date, b.start_date, dir);
      case "due_date":
        return compareDates(a.due_date, b.due_date, dir);
      case "assignee":
        return compareStrings(
          assigneeSortLabel(members, taskAssigneeIds(a.id)),
          assigneeSortLabel(members, taskAssigneeIds(b.id)),
          dir
        );
      default:
        return 0;
    }
  });
}
