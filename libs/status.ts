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

// Tonal status-pill classes (defined in app/globals.css) for a status value.
// Returns the full class string, including the base `.status-pill` — callers
// apply it directly, no `badge` prefix. "In progress" reads as the brand
// burgundy; other states sit on the reserved semantic ramp.
export const projectStatusBadgeClass = (s: string): string => {
  switch (s) {
    case "in_progress":
      return "status-pill status-in_progress";
    case "complete":
      return "status-pill status-complete";
    case "on_hold":
      return "status-pill status-on_hold";
    default:
      return "status-pill status-not_started";
  }
};

export const taskStatusBadgeClass = (s: string): string => {
  switch (s) {
    case "in_progress":
      return "status-pill status-in_progress";
    case "complete":
      return "status-pill status-complete";
    case "blocked":
      return "status-pill status-blocked";
    default:
      return "status-pill status-not_started";
  }
};
