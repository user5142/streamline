import type { JSX } from "react";

// Problem agitation: sits between the hero's promise and the features payoff.
// Names the cost of *not* fixing the problem — deliberately never mentions
// Streamline. Three failure modes, shown as calm cards on the dark Ink panel.

type Pain = {
  title: string;
  body: string;
  icon: JSX.Element;
};

const PAINS: Pain[] = [
  {
    title: "Status lives in spreadsheets",
    body: "Project health is scattered across tabs, docs, and DMs. Pulling a straight answer on what's on track means chasing people.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
      />
    ),
  },
  {
    title: "Deadlines slip unnoticed",
    body: "Without one timeline, a date moves and nobody sees the knock-on effects until something downstream is already late.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  {
    title: "Nobody's sure who owns what",
    body: "Tasks blur between people and teams. Work stalls in the gaps because ownership was never actually clear.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    ),
  },
];

const Problem = () => {
  return (
    <section className="bg-neutral text-neutral-content">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow eyebrow-on-dark mx-auto">The hidden tax</span>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            When managing projects is only half your job
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-neutral-content/70">
            You didn&apos;t sign up to be a project manager — but the work still
            has to land. Without the right tool, the cracks show up fast.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {PAINS.map((pain) => (
            <div
              key={pain.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-sm"
            >
              <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-neutral-content">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.6}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  {pain.icon}
                </svg>
              </span>
              <h3 className="font-display text-lg font-semibold">{pain.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-content/65">
                {pain.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Problem;
