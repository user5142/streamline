import { memberDisplayLabel, type OrgMember } from "@/libs/orgMember";
import { PROJECT_STATUSES } from "@/libs/status";
import type { Project, Team } from "@/types/database";

export type ProjectSortColumn =
  | "name"
  | "team"
  | "owner"
  | "status"
  | "start_date"
  | "target"
  | "actual";

export type SortDirection = "asc" | "desc";

export const PROJECT_SORT_COLUMNS: {
  value: ProjectSortColumn;
  label: string;
}[] = [
  { value: "name", label: "Name" },
  { value: "team", label: "Team" },
  { value: "owner", label: "Owner" },
  { value: "status", label: "Status" },
  { value: "start_date", label: "Start date" },
  { value: "target", label: "Target" },
  { value: "actual", label: "Actual" },
];

const STATUS_SORT_ORDER = new Map(
  PROJECT_STATUSES.map((s, i) => [s.value, i])
);

function compareStrings(a: string, b: string, dir: number): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" }) * dir;
}

function compareDates(
  a: string | null,
  b: string | null,
  dir: number
): number {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return (new Date(a).getTime() - new Date(b).getTime()) * dir;
}

function teamName(teams: Team[], id: string | null): string {
  return (id && teams.find((t) => t.id === id)?.name) || "—";
}

function memberName(members: OrgMember[], id: string | null): string {
  if (!id) return "—";
  const m = members.find((x) => x.id === id);
  return m ? memberDisplayLabel(m) : "—";
}

export function sortProjects(
  projects: Project[],
  sortColumn: ProjectSortColumn,
  sortDirection: SortDirection,
  teams: Team[],
  members: OrgMember[]
): Project[] {
  const dir = sortDirection === "asc" ? 1 : -1;

  return [...projects].sort((a, b) => {
    switch (sortColumn) {
      case "name":
        return compareStrings(a.name, b.name, dir);
      case "team":
        return compareStrings(
          teamName(teams, a.team_id),
          teamName(teams, b.team_id),
          dir
        );
      case "owner":
        return compareStrings(
          memberName(members, a.owner_id),
          memberName(members, b.owner_id),
          dir
        );
      case "status": {
        const aOrder = STATUS_SORT_ORDER.get(a.status) ?? 999;
        const bOrder = STATUS_SORT_ORDER.get(b.status) ?? 999;
        return (aOrder - bOrder) * dir;
      }
      case "start_date":
        return compareDates(a.start_date, b.start_date, dir);
      case "target":
        return compareDates(
          a.target_completion_date,
          b.target_completion_date,
          dir
        );
      case "actual":
        return compareDates(
          a.actual_completion_date,
          b.actual_completion_date,
          dir
        );
      default:
        return 0;
    }
  });
}
