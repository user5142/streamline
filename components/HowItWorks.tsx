import { ScreenshotFrame } from "./AppPreview";

// "How it works" — a genuine sequence (set up → plan → track), so numbered
// markers actually encode order the reader needs, rather than decorate.

const STEPS = [
  {
    n: "01",
    title: "Create your org, invite your team",
    body: "Spin up your organization and add teammates with a single secure link. No email setup, no seats to configure — they're in.",
  },
  {
    n: "02",
    title: "Add projects and break them into tasks",
    body: "Give each project an owner, a team, and target dates. Split the work into tasks and lightweight action items as you go.",
  },
  {
    n: "03",
    title: "Track everything on one timeline",
    body: "Watch every project land on the company-wide Gantt. Filter by team or person to see exactly what's moving and what's at risk.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-base-100" id="how-it-works">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Steps */}
          <div>
            <span className="eyebrow">How it works</span>
            <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-base-content sm:text-4xl lg:text-5xl">
              From scattered to on-track in an afternoon
            </h2>

            <ol className="mt-10 space-y-8">
              {STEPS.map((step, i) => (
                <li key={step.n} className="relative flex gap-5">
                  {/* connector line */}
                  {i < STEPS.length - 1 && (
                    <span
                      className="absolute left-[1.4375rem] top-12 h-[calc(100%-1rem)] w-px bg-base-300"
                      aria-hidden="true"
                    />
                  )}
                  <span className="z-10 grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-tint font-display text-sm font-bold text-primary ring-1 ring-primary/15">
                    {step.n}
                  </span>
                  <div className="pt-1">
                    <h3 className="font-display text-lg font-semibold text-base-content">
                      {step.title}
                    </h3>
                    <p className="mt-1.5 leading-relaxed text-base-content/70">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Visual */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            <ScreenshotFrame label="Project detail view" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
