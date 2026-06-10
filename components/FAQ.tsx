"use client";

import { useRef, useState } from "react";
import type { JSX } from "react";

// <FAQ> component is a lsit of <Item> component
// Just import the FAQ & add your FAQ content to the const faqList arrayy below.

interface FAQItemProps {
  question: string;
  answer: JSX.Element;
}

const faqList: FAQItemProps[] = [
  {
    question: "What is Streamline?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        Streamline is a lightweight project management tool for people who run
        projects as part of their role. You get projects, tasks, teams, and a
        company-wide Gantt chart — without the overhead of heavier tools.
      </div>
    ),
  },
  {
    question: "Who is Streamline for?",
    answer: (
      <p>
        Anyone who manages projects but isn&apos;t a formal project manager —
        team leads, operations folks, marketers, founders. If Jira or Asana
        feels like too much for how you actually work, Streamline is for you.
      </p>
    ),
  },
  {
    question: "How is it different from Jira or Asana?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        It&apos;s deliberately simpler. Streamline focuses on the essentials —
        projects, tasks, action items, and a clear timeline view — so you can
        get organized in minutes instead of configuring workflows for hours.
      </div>
    ),
  },
  {
    question: "How do I get my team on board?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        Admins generate a secure invite link and share it however they like —
        Slack, email, anywhere. New teammates join your org in one click. Links
        expire after 7 days and can only be used once.
      </div>
    ),
  },
  {
    question: "Is my organization's data kept private?",
    answer: (
      <div className="space-y-2 leading-relaxed">
        Yes. All data is scoped to your organization and protected by row-level
        security, so users only ever see projects and tasks within their own
        org.
      </div>
    ),
  },
];

const FaqItem = ({ item }: { item: FAQItemProps }) => {
  const accordion = useRef(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <li className="rounded-2xl border border-base-300 bg-base-100">
      <button
        className="relative flex w-full items-center gap-3 px-5 py-4 text-left text-base font-semibold md:text-lg"
        onClick={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        aria-expanded={isOpen}
      >
        <span
          className={`flex-1 ${isOpen ? "text-primary" : "text-base-content"}`}
        >
          {item?.question}
        </span>
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors duration-200 ${
            isOpen ? "bg-primary text-primary-content" : "bg-base-200 text-base-content/60"
          }`}
        >
          <svg
            className="h-3.5 w-3.5 fill-current"
            viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect y="7" width="16" height="2" rx="1" />
            <rect
              y="7"
              width="16"
              height="2"
              rx="1"
              className={`origin-center transition duration-200 ease-out ${
                isOpen ? "rotate-180 opacity-0" : "rotate-90"
              }`}
            />
          </svg>
        </span>
      </button>

      <div
        ref={accordion}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={
          isOpen
            ? { maxHeight: accordion?.current?.scrollHeight, opacity: 1 }
            : { maxHeight: 0, opacity: 0 }
        }
      >
        <div className="px-5 pb-5 leading-relaxed text-base-content/70">
          {item?.answer}
        </div>
      </div>
    </li>
  );
};

const FAQ = () => {
  return (
    <section className="bg-base-200" id="faq">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8 lg:py-28">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <span className="eyebrow">FAQ</span>
          <h2 className="mt-5 font-display text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
            Questions, answered
          </h2>
          <p className="mt-4 leading-relaxed text-base-content/70">
            Still curious about something? Reach out and we&apos;ll help you get
            set up.
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {faqList.map((item, i) => (
            <FaqItem key={i} item={item} />
          ))}
        </ul>
      </div>
    </section>
  );
};

export default FAQ;
