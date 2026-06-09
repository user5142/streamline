import Link from "next/link";
import GanttView from "./GanttView";

export const dynamic = "force-dynamic";

// Company-wide Gantt (GNT-01..GNT-04). The /dashboard layout guarantees an
// authenticated user with an org; all data is loaded client-side (RLS scopes
// it to the org) so filters and expansion stay snappy.
export default function GanttPage() {
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-6xl mx-auto space-y-6">
        <div>
          <Link href="/dashboard" className="link link-hover text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-1">
            Gantt timeline
          </h1>
          <p className="text-sm text-base-content/70 mt-1">
            All projects across the org. Filter by team or person, and click a
            project bar to expand its tasks.
          </p>
        </div>

        <GanttView />
      </section>
    </main>
  );
}
