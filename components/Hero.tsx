import Link from "next/link";
import AppPreview from "./AppPreview";
import config from "@/config";

const Hero = () => {
  return (
    <section className="relative overflow-hidden border-b border-base-300 bg-base-100">
      {/* Faint grid atmosphere, fading out toward the bottom */}
      <div
        className="bg-grid-faint pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8 lg:py-24">
        {/* Copy */}
        <div className="flex flex-col items-start gap-6 text-left">
          <span className="eyebrow">Project management, minus the overhead</span>

          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-base-content sm:text-5xl lg:text-6xl">
            Run your projects without the{" "}
            <span className="text-primary">project-manager</span> job title
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-base-content/70">
            Streamline puts your projects, tasks, and a company-wide Gantt in one
            clean view — without the weight of Jira or Asana. Built for people who
            run projects as part of their role, not their title.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href={`${config.auth.loginUrl}?mode=signup`}
              className="btn btn-primary btn-lg"
            >
              Get started free
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <Link href="/#how-it-works" className="btn btn-ghost btn-lg">
              See how it works
            </Link>
          </div>

          {/* Trust row — concrete capabilities, not invented testimonials */}
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-base-content/60">
            {[
              "No credit card required",
              "Set up in minutes",
              "Invite your team by link",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Signature: the live Gantt mock */}
        <div className="relative animate-rise [animation-delay:0.1s] lg:pl-4">
          {/* Soft brand glow behind the frame */}
          <div
            className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary/5 blur-2xl"
            aria-hidden="true"
          />
          <AppPreview />
        </div>
      </div>
    </section>
  );
};

export default Hero;
