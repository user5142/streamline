import { getProfile } from "@/libs/supabase/getProfile";
import TodoClient from "./TodoClient";

export const dynamic = "force-dynamic";

export default async function TodoPage() {
  const profile = await getProfile();
  if (!profile?.id) return null;

  return (
    <main className="min-h-screen p-6 pb-24 lg:p-8">
      <section className="mx-auto max-w-2xl space-y-8">
        <header className="space-y-1">
          <h1 className="font-display text-2xl font-semibold text-base-content">
            To-Do List
          </h1>
          <p className="text-sm text-base-content/60">
            Your personal checklist. Only you can see these items. Drag a row to
            re-order it.
          </p>
        </header>
        <TodoClient orgId={profile.org_id} />
      </section>
    </main>
  );
}
