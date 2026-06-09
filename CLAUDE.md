# Streamline

Simplified project management for people who manage projects as part of their role — not formal project managers. Lighter than Jira or Asana. MVP v1, hackathon scope.

## Tech stack

- **Boilerplate:** ShipFast (TypeScript repo, Supabase variant) — Next.js-based SaaS starter
- **Frontend:** Next.js 15+ with App Router, React 19+, TypeScript 5.9+
- **Styling:** TailwindCSS 4.1+ with DaisyUI 5.0+ component library
- **Backend:** Supabase (Postgres + Auth + RLS)
- **Auth:** NextAuth v5 (beta) wired to Supabase — email/password only for MVP
- **Gantt library:** Frappe Gantt (do not build a custom renderer)

ShipFast also ships with Stripe (payments) and Resend (email). **These are not used in MVP v1.** Do not add payment flows or email notifications unless the requirements document is updated.

Once the repo is configured, document the dev commands here (install, dev server, build, test).

## Project structure

```
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API routes (auth, webhooks, etc.)
│   ├── dashboard/         # Protected user dashboard
│   └── (auth)/           # Authentication pages
├── components/            # Reusable UI components
├── libs/                  # Utility libraries and configurations
├── types/                 # TypeScript type definitions
└── config.ts              # Centralized app configuration
```

## Data model

```
Organization
├── Teams (with members)
└── Projects (assigned to a team)
    └── Tasks (assigned to members)
        └── Action Items (checklist subtasks)
```

All data is org-scoped. Row Level Security on every table — users must never see data outside their org.

## Auth & roles

- Email/password via Supabase Auth (no Google OAuth or magic links for MVP)
- Profile info in a custom `profiles` table linked to `auth.users`
- Two roles: **admin** (manage org, users, teams, all projects) and **member** (view/edit assigned projects)
- Invite system: token-based links (7-day expiry, single-use), no in-app email sending

## MVP scope

The requirements are in `streamline-requirements.md`. Explicitly out of scope for v1:

- Email notifications
- Comments or file attachments
- Reporting / analytics
- SSO / OAuth (Google, GitHub)
- Mobile app
- Time tracking
- Custom fields

Do not introduce any of the above unless the requirements document is updated first.

## Development guidelines

### General
- **Always use TypeScript** — proper type definitions on all functions, components, and data structures; do not use `any` unless absolutely necessary
- **Follow Next.js 15+ App Router patterns** — Server Components by default; add `"use client"` only when necessary
- **Follow existing patterns** — study existing components and API routes to maintain consistency
- **All configuration** goes through `/config.ts`; never hardcode values

### Components
- Functional components with hooks; PascalCase filenames in `/components/`
- TypeScript interfaces for all props
- DaisyUI classes for styling; Tailwind breakpoints for responsiveness
- Always include loading states and error handling
- Follow accessibility best practices (semantic HTML, ARIA attributes)
- Use `@import "tailwindcss"` (not legacy `@tailwind` directives); configure theme via `@theme` in CSS

### API routes
- Create routes at `/app/api/[feature]/route.ts`; export named HTTP method handlers
- Use Supabase client for all database operations (not Mongoose/MongoDB)
- Validate request bodies; return consistent JSON with proper HTTP status codes
- Check auth session when the route requires a logged-in user

### Database (Supabase)
- All queries go through the Supabase client from `/libs/`
- RLS is the primary access-control layer — every table must have RLS policies
- Handle async operations and database errors explicitly
- Never expose data outside the user's org

### Authentication
- Use the auth helper from `/libs/` to read the session in both Server Components and API routes
- Redirect unauthenticated users from protected routes
- Do not add OAuth providers or magic links without updating requirements first

### Error handling
- `try/catch` in all async operations; log with descriptive context
- Proper HTTP status codes in API routes
- Toast notifications for user-facing errors; visible loading states in components

### Security
- Validate all user inputs server-side
- Rely on RLS for data isolation (never filter by org in the app layer alone)
- Follow OWASP guidelines; sanitize before any write operation

## Prompt logging

Every time the user submits a prompt, append an entry to `PROMPTS.md` with:
- The model used (e.g., `Claude Sonnet 4.6`)
- The user's exact input as a blockquote

Use this format:

```
---

**Model:** <model name>

> <user prompt>
```

Do this before responding to the prompt.

## Key implementation notes

- Gantt chart is a core feature (company-wide + filter by team + filter by person + task-level bars). Use **Frappe Gantt** — do not build a custom renderer.
- Invite links encode a random token stored in Supabase — validate expiry and single-use before joining user to org.
- Tasks can have multiple assignees. Action items are lightweight (no assignee or due date for MVP).

## Key files

- `/config.ts` — central app configuration
- `/libs/` — Supabase client, auth helpers, and other utilities
- `/types/config.ts` — configuration type definitions
- `/components/LayoutClient.tsx` — client-side layout wrapper
- `streamline-requirements.md` — full MVP feature requirements
