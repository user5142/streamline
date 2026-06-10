import GanttView from "./GanttView";

export const dynamic = "force-dynamic";

// Company-wide Gantt (GNT-01..GNT-04). The /dashboard layout guarantees an
// authenticated user with an org; all data is loaded client-side (RLS scopes
// it to the org) so filters and expansion stay snappy.
export default function GanttPage() {
  return (
    <main className="min-h-screen p-6 pb-24 lg:p-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Gantt timeline
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            All projects across the org. Filter by team or person, and click a
            project bar to expand its tasks.
          </p>
        </div>

        <GanttView />
      </section>
    </main>
  );
}
