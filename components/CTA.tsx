import Link from "next/link";
import config from "@/config";

const CTA = () => {
  return (
    <section className="bg-base-200 px-6 py-20 lg:px-8 lg:py-28">
      <div className="bg-brand-gradient relative mx-auto max-w-5xl overflow-hidden rounded-[1.75rem] px-8 py-16 text-center shadow-[var(--shadow-lift)] sm:px-16 sm:py-20">
        {/* Faint grid texture on the panel */}
        <div
          className="bg-grid-faint pointer-events-none absolute inset-0 opacity-[0.15] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          aria-hidden="true"
        />

        <div className="relative mx-auto flex max-w-xl flex-col items-center">
          <span className="eyebrow eyebrow-on-dark">Get started</span>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Get your projects on track today
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/75">
            Stop juggling spreadsheets and status pings. Plan, assign, and track
            every project in one place — free to start, no card required.
          </p>

          <Link
            href={config.auth.loginUrl}
            className="btn btn-lg mt-9 border-0 bg-white text-primary hover:bg-white/90"
          >
            Get {config.appName} free
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
        </div>
      </div>
    </section>
  );
};

export default CTA;
