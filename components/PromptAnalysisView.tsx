"use client";

import Image from "next/image";
import Link from "next/link";
import type { PromptAnalysis } from "@/libs/promptAnalysis";
import config from "@/config";

interface PromptAnalysisViewProps {
  data: PromptAnalysis;
}

export default function PromptAnalysisView({ data }: PromptAnalysisViewProps) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 lg:py-16">
      <header className="mb-10">
        <Link href="/dashboard/gantt" className="inline-block mb-8">
          <Image
            src="/streamline-logo.svg"
            alt={config.appName}
            width={140}
            height={32}
            className="h-8 w-auto"
          />
        </Link>

        <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-3">
          {data.title}
        </h1>
        <p className="text-lg text-base-content/60">{data.subtitle}</p>
      </header>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="rounded-xl bg-base-100 border border-base-300 px-4 py-4 text-center">
          <p className="text-3xl font-display font-bold text-primary">
            {data.stats.totalPrompts}
          </p>
          <p className="text-xs text-base-content/60 mt-1">prompts</p>
        </div>
        <div className="rounded-xl bg-base-100 border border-base-300 px-4 py-4 text-center">
          <p className="text-3xl font-display font-bold text-primary">
            {data.stats.buildDuration}
          </p>
          <p className="text-xs text-base-content/60 mt-1">build window</p>
        </div>
        <div className="rounded-xl bg-base-100 border border-base-300 px-4 py-4 text-center">
          <p className="text-2xl font-display font-bold text-primary">
            {data.stats.featuresShipped}
          </p>
          <p className="text-xs text-base-content/60 mt-1">shipped</p>
        </div>
      </div>

      <p className="text-lg text-base-content/80 leading-relaxed mb-10">
        {data.pitch}
      </p>

      <section className="mb-8">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-primary mb-3">
          What we shipped
        </h2>
        <ul className="space-y-2">
          {data.shipped.map((item) => (
            <li key={item} className="text-base-content/80">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="font-display text-sm font-semibold uppercase tracking-widest text-primary mb-3">
          How AI helped
        </h2>
        <ul className="space-y-2">
          {data.aiApproach.map((item) => (
            <li key={item} className="text-base-content/80">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <blockquote className="rounded-xl bg-neutral text-neutral-content px-6 py-5 text-lg leading-relaxed">
        {data.takeaway}
      </blockquote>
    </div>
  );
}
