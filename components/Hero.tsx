import Image from "next/image";
import Link from "next/link";
import config from "@/config";

const TRUST = [
  "No credit card required",
  "Set up in minutes",
  "Invite your team by link",
];

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-base-100">
      {/* Soft brand glow centered behind the headline */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -z-0 h-[34rem] w-[64rem] max-w-[120vw] -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-20 lg:px-8 lg:pt-28 lg:pb-28">
        {/* Copy — centered, single focused column */}
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span className="eyebrow">Project management, minus the overhead</span>

          <h1 className="mt-6 max-w-4xl text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-base-content sm:text-5xl lg:text-[3.5rem]">
            Project management for people with{" "}
            <span className="text-primary">other jobs</span> to do
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-base-content/70">
            Streamline puts your projects, tasks, and a company-wide Gantt in one
            clean view — without the weight of Jira or Asana. Built for people who
            run projects as part of their role, not their title.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-base-content/60">
            {TRUST.map((item) => (
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

        {/* Signature: the product screenshot, shown large and product-led */}
        <div className="relative mx-auto mt-16 max-w-5xl animate-rise [animation-delay:0.12s] lg:mt-20">
          {/* Soft brand glow behind the frame */}
          <div
            className="absolute -inset-x-6 -top-6 bottom-0 -z-10 rounded-[2.5rem] bg-primary/5 blur-2xl"
            aria-hidden="true"
          />
          <Image
            src="/streamline-dashboard.png"
            alt="Streamline Gantt timeline dashboard"
            width={1024}
            height={549}
            priority
            className="h-auto w-full rounded-2xl border border-base-300 bg-base-100 shadow-[var(--shadow-lift)]"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
