import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/libs/supabase/server";
import ProjectDetailClient from "./ProjectDetailClient";
import TasksSection from "./TasksSection";
import type { Project, Team } from "@/types/database";

export const dynamic = "force-dynamic";

// Project detail + edit (PRJ-02, PRJ-03, PRJ-04). Data is loaded server-side so
// a missing/forbidden project renders a proper 404; edits are done client-side.
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [projectRes, teamsRes, membersRes] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("teams").select("*").order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, email, is_external")
      .order("full_name"),
  ]);

  const project = projectRes.data as Project | null;
  if (!project) notFound();

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-3xl mx-auto space-y-8">
        <div>
          <Link
            href="/dashboard/projects"
            className="link link-hover text-sm"
          >
            ← Projects
          </Link>
        </div>

        <ProjectDetailClient
          project={project}
          teams={(teamsRes.data as Team[]) ?? []}
          members={
            ((membersRes.data as {
              id: string;
              full_name: string | null;
              email: string | null;
              is_external: boolean;
            }[]) ?? []).map((m) => ({
              ...m,
              is_external: m.is_external ?? false,
            }))
          }
        />

        <TasksSection
          projectId={project.id}
          orgId={project.org_id}
          members={
            ((membersRes.data as {
              id: string;
              full_name: string | null;
              email: string | null;
              is_external: boolean;
            }[]) ?? []).map((m) => ({
              ...m,
              is_external: m.is_external ?? false,
            }))
          }
        />
      </section>
    </main>
  );
}
