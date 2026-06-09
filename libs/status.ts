import type { ProjectStatus, TaskStatus } from "@/types/database";

// Shared status option lists + display helpers for projects and tasks.

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Complete" },
  { value: "on_hold", label: "On hold" },
];

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "complete", label: "Complete" },
  { value: "blocked", label: "Blocked" },
];

export const projectStatusLabel = (s: string): string =>
  PROJECT_STATUSES.find((x) => x.value === s)?.label ?? s;

export const taskStatusLabel = (s: string): string =>
  TASK_STATUSES.find((x) => x.value === s)?.label ?? s;

// DaisyUI badge modifier classes for a status value.
export const projectStatusBadgeClass = (s: string): string => {
  switch (s) {
    case "in_progress":
      return "badge-info";
    case "complete":
      return "badge-success";
    case "on_hold":
      return "badge-warning";
    default:
      return "badge-ghost";
  }
};

export const taskStatusBadgeClass = (s: string): string => {
  switch (s) {
    case "in_progress":
      return "badge-info";
    case "complete":
      return "badge-success";
    case "blocked":
      return "badge-error";
    default:
      return "badge-ghost";
  }
};
