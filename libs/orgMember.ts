export interface OrgMember {
  id: string;
  full_name: string | null;
  email: string | null;
  is_external: boolean;
}

export function memberLabel(m: Pick<OrgMember, "full_name" | "email">): string {
  return m.full_name || m.email || "Unknown user";
}

export function memberDisplayLabel(m: OrgMember): string {
  const base = memberLabel(m);
  return m.is_external ? `${base} (External)` : base;
}
