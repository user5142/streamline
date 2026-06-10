// AppPreview — the marketing site's signature element.
//
// A browser-framed mock of Streamline's company-wide Gantt, drawn entirely in
// CSS so it stays crisp at any size and animates on load. The timeline bar is
// the most characteristic artifact of this product's world, so it leads the
// page instead of a stock photo.
//
// When real product screenshots exist, drop one into <ScreenshotFrame> (below)
// and swap it in for this component — the chrome/frame styling is shared.

import type { ReactNode } from "react";

type GanttRow = {
  label: string;
  team: string;
  /** left offset as a % of the timeline track */
  offset: number;
  /** bar width as a % of the timeline track */
  width: number;
  /** tailwind/arbitrary color for the bar fill */
  color: string;
};

const ROWS: GanttRow[] = [
  { label: "Website relaunch", team: "Marketing", offset: 0, width: 38, color: "#811844" },
  { label: "Q3 hiring plan", team: "Operations", offset: 12, width: 30, color: "#b8336a" },
  { label: "Mobile app v2", team: "Engineering", offset: 28, width: 46, color: "#5e0f31" },
  { label: "Onboarding revamp", team: "Product", offset: 44, width: 34, color: "#c96a90" },
  { label: "Vendor migration", team: "Operations", offset: 58, width: 30, color: "#811844" },
];

const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov"];

const BrowserChrome = ({ children }: { children: ReactNode }) => (
  <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-[var(--shadow-lift)]">
    {/* Title bar */}
    <div className="flex items-center gap-2 border-b border-base-300 bg-base-200/70 px-4 py-3">
      <span className="flex gap-1.5">
        <span className="h-3 w-3 rounded-full bg-base-300" />
        <span className="h-3 w-3 rounded-full bg-base-300" />
        <span className="h-3 w-3 rounded-full bg-base-300" />
      </span>
      <span className="mx-auto hidden items-center gap-2 rounded-md bg-base-100 px-3 py-1 text-xs text-base-content/50 ring-1 ring-base-300 sm:flex">
        <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 0h10.5a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5v-6a1.5 1.5 0 0 1 1.5-1.5Z" />
        </svg>
        app.streamline.com/gantt
      </span>
    </div>
    {children}
  </div>
);

const AppPreview = () => {
  return (
    <BrowserChrome>
      <div className="flex">
        {/* Faux sidebar */}
        <aside className="hidden w-14 shrink-0 flex-col items-center gap-5 border-r border-base-300 bg-base-200/50 py-5 sm:flex">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-[0.65rem] font-bold text-primary-content">
            S
          </span>
          <span className="h-1.5 w-6 rounded-full bg-primary/70" />
          <span className="h-1.5 w-6 rounded-full bg-base-300" />
          <span className="h-1.5 w-6 rounded-full bg-base-300" />
          <span className="mt-auto h-6 w-6 rounded-full bg-base-300" />
        </aside>

        {/* Main panel */}
        <div className="min-w-0 flex-1 p-5 sm:p-6">
          {/* Header + filter chips */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-display text-sm font-semibold text-base-content">
                Gantt timeline
              </div>
              <div className="text-xs text-base-content/50">12 active projects</div>
            </div>
            <div className="flex gap-1.5">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.7rem] font-medium text-primary">
                All teams
              </span>
              <span className="rounded-full bg-base-200 px-2.5 py-1 text-[0.7rem] font-medium text-base-content/60 ring-1 ring-base-300">
                This quarter
              </span>
            </div>
          </div>

          {/* Month ruler */}
          <div className="mb-2 grid grid-cols-5 gap-px pl-[34%] text-[0.65rem] font-medium text-base-content/40">
            {MONTHS.map((m) => (
              <span key={m} className="text-center">
                {m}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-2.5">
            {ROWS.map((row, i) => (
              <div key={row.label} className="flex items-center gap-3">
                <div className="w-[34%] min-w-0 pr-2">
                  <div className="truncate text-xs font-medium text-base-content/80">
                    {row.label}
                  </div>
                  <div className="truncate text-[0.65rem] text-base-content/40">
                    {row.team}
                  </div>
                </div>
                <div className="relative h-5 flex-1 rounded-md bg-base-200">
                  <div
                    className="absolute inset-y-0 my-auto h-3.5 origin-left rounded-md animate-grow-bar"
                    style={{
                      left: `${row.offset}%`,
                      width: `${row.width}%`,
                      backgroundColor: row.color,
                      animationDelay: `${0.15 + i * 0.1}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Today marker caption */}
          <div className="mt-4 flex items-center gap-2 text-[0.65rem] text-base-content/40">
            <span className="h-2 w-2 rounded-full bg-success" />
            On track
            <span className="ml-2 h-2 w-2 rounded-full bg-warning" />
            At risk
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
};

// Reusable empty frame for dropping a real screenshot in later.
export const ScreenshotFrame = ({
  label = "Screenshot",
  className = "",
}: {
  label?: string;
  className?: string;
}) => (
  <BrowserChrome>
    <div
      className={`bg-grid-faint flex aspect-[16/10] items-center justify-center bg-base-200/40 ${className}`}
    >
      <div className="flex flex-col items-center gap-2 text-base-content/35">
        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
        </svg>
        <span className="text-xs font-medium">{label}</span>
      </div>
    </div>
  </BrowserChrome>
);

export default AppPreview;
