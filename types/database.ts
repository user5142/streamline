// Streamline domain types — mirror the Supabase schema in /supabase/migrations.
// Hand-maintained for the MVP. If we later adopt `supabase gen types`, this
// file can be replaced by the generated `Database` type.

export type Role = "admin" | "member";

export type ProjectStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "on_hold";

export type TaskStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "blocked";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  org_id: string | null;
  role: Role;
  /** Placeholder for vendors/partners who do not have a Streamline login. */
  is_external: boolean;
  created_at: string;
}

export interface Invite {
  id: string;
  org_id: string;
  token: string;
  email: string | null;
  role: Role;
  expires_at: string;
  used_at: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  profile_id: string;
  created_at: string;
}

export interface Project {
  id: string;
  org_id: string;
  team_id: string | null;
  name: string;
  description: string | null;
  owner_id: string | null;
  status: ProjectStatus;
  budget: number | null;
  start_date: string | null;
  target_completion_date: string | null;
  actual_completion_date: string | null;
  /** When false, the project is hidden from the company-wide Gantt timeline. */
  show_on_gantt: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  org_id: string;
  project_id: string;
  name: string;
  description: string | null;
  status: TaskStatus;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
}

export interface TaskAssignee {
  task_id: string;
  profile_id: string;
  created_at: string;
}

export interface ActionItem {
  id: string;
  task_id: string;
  title: string;
  is_complete: boolean;
  position: number;
  created_at: string;
}

/**
 * Personal to-do list item. Unlike most tables this is per-user (visible only
 * to its owner), ordered by `position` so the list can be drag-reordered.
 */
export interface TodoItem {
  id: string;
  owner_id: string;
  org_id: string | null;
  content: string;
  is_complete: boolean;
  position: number;
  created_at: string;
}
