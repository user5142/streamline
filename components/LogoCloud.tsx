// Social-proof strip. The wordmarks below are PLACEHOLDERS — swap them for real
// customer logos (or <Image> files) once you have them. Kept intentionally
// understated and monochrome so the strip reads as quiet credibility, not noise.

const PLACEHOLDER_LOGOS = [
  "Northwind",
  "Lumen",
  "Acme Co",
  "Brightwave",
  "Meridian",
  "Vantage",
];

const LogoCloud = () => {
  return (
    <section className="border-b border-base-300 bg-base-100">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-12">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-base-content/40">
          The teams getting organized with Streamline
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 sm:gap-x-14">
          {PLACEHOLDER_LOGOS.map((name) => (
            <span
              key={name}
              className="font-display text-lg font-semibold tracking-tight text-base-content/35 transition-colors hover:text-base-content/55"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoCloud;
