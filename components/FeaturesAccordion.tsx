"use client";

import { useState } from "react";
import type { JSX } from "react";
import AppPreview, { ScreenshotFrame } from "./AppPreview";

interface Feature {
  title: string;
  description: string;
  // What shows in the media panel: the live Gantt mock, or a labeled
  // screenshot placeholder to swap for a real capture later.
  preview: "gantt" | string;
  svg: JSX.Element;
}

const features: Feature[] = [
  {
    title: "Company-wide Gantt",
    description:
      "See every active project across your org on one timeline. Filter by team or by person, and expand any project to view its tasks as sub-bars — powered by Frappe Gantt.",
    preview: "gantt",
    svg: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h10.5M3.75 12h13.5M3.75 17.25h7.5"
      />
    ),
  },
  {
    title: "Projects & tasks",
    description:
      "Create projects with an owner, team, and target dates, then break them into tasks with assignees and due dates. Track status independently at every level, right down to checklist-style action items.",
    preview: "Projects & tasks",
    svg: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    ),
  },
  {
    title: "Teams & people",
    description:
      "Organize your org into teams like Engineering, Marketing, or Operations. Assign projects to teams and tasks to the right people, so the Gantt filters cleanly by either.",
    preview: "Teams & people",
    svg: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    ),
  },
  {
    title: "Invite by link",
    description:
      "Add teammates in seconds with a single, secure invite link. No email setup required — share it on Slack or anywhere else, and links expire after 7 days for safety.",
    preview: "Invite teammates",
    svg: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
      />
    ),
  },
];

const Item = ({
  feature,
  isOpen,
  setFeatureSelected,
}: {
  feature: Feature;
  isOpen: boolean;
  setFeatureSelected: () => void;
}) => {
  const { title, description, svg } = feature;

  return (
    <li
      className={`rounded-2xl border transition-colors duration-200 ${
        isOpen
          ? "border-base-300 bg-base-100 shadow-[var(--shadow-soft)]"
          : "border-transparent hover:bg-base-100/60"
      }`}
    >
      <button
        className="flex w-full items-center gap-4 px-5 py-4 text-left"
        onClick={(e) => {
          e.preventDefault();
          setFeatureSelected();
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors duration-200 ${
            isOpen
              ? "bg-primary text-primary-content"
              : "bg-base-200 text-base-content/60"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.7}
            stroke="currentColor"
            className="h-5 w-5"
          >
            {svg}
          </svg>
        </span>
        <span
          className={`flex-1 font-display text-base font-semibold md:text-lg ${
            isOpen ? "text-primary" : "text-base-content"
          }`}
        >
          <h3 className="inline">{title}</h3>
        </span>
      </button>

      <div
        className="grid overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div className="min-h-0">
          <p className="px-5 pb-5 pl-[4.75rem] text-[0.95rem] leading-relaxed text-base-content/70">
            {description}
          </p>
        </div>
      </div>
    </li>
  );
};

const Media = ({ feature }: { feature: Feature }) => {
  if (feature.preview === "gantt") {
    return <AppPreview />;
  }
  return <ScreenshotFrame label={feature.preview} />;
};

const FeaturesAccordion = () => {
  const [featureSelected, setFeatureSelected] = useState<number>(0);

  return (
    <section className="bg-base-200" id="features">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
        <div className="max-w-2xl">
          <span className="eyebrow">Everything in one place</span>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-base-content sm:text-4xl lg:text-5xl">
            Everything you need to keep projects on track
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-base-content/70">
            The essentials, nothing you&apos;ll never use. Plan the work, assign
            it, and watch it move — all from one timeline.
          </p>
        </div>

        <div className="mt-12 grid items-center gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-16">
          <ul className="flex flex-col gap-1">
            {features.map((feature, i) => (
              <Item
                key={feature.title}
                feature={feature}
                isOpen={featureSelected === i}
                setFeatureSelected={() => setFeatureSelected(i)}
              />
            ))}
          </ul>

          <div key={featureSelected} className="animate-opacity lg:pl-4">
            <Media feature={features[featureSelected]} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesAccordion;
