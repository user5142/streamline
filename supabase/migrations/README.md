# Supabase migrations

Versioned SQL for the Streamline schema. Apply files **in numeric order**.

## Apply via the Supabase SQL editor (quickest)

1. Open your project → **SQL Editor** → **New query**.
2. Paste the contents of each file, oldest first (`0001` → `0005`), and run.

## Apply via the Supabase CLI (optional)

```bash
supabase db push
```

(Requires a linked project: `supabase link --project-ref <ref>`.)

## Files

| File | Contents |
|------|----------|
| `0001_core_org_profiles.sql` | `organizations`, `profiles`, RLS helper functions (`current_org_id`, `is_admin`), new-user trigger |
| `0002_invites.sql` | `invites` (token, 7-day expiry, single-use) |
| `0003_teams.sql` | `teams`, `team_members` |
| `0004_projects.sql` | `projects` |
| `0005_tasks_action_items.sql` | `tasks`, `task_assignees`, `action_items` |

## Notes

- Every table has **Row Level Security** enabled and is **org-scoped**. The
  `current_org_id()` / `is_admin()` helpers are `SECURITY DEFINER` to avoid
  infinite recursion in policies that would otherwise re-query `profiles`.
- A profile row is created automatically on sign-up via the
  `on_auth_user_created` trigger; `org_id` / `role` are filled in during
  onboarding (Chunk 2).
- Migrations are written to be **idempotent** (`if not exists`,
  `drop policy if exists`) so re-running them is safe.
