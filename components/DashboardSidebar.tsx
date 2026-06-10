"use client";

import { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import config from "@/config";
import ButtonAccount from "./ButtonAccount";

// Left-hand navigation for the dashboard. Rendered inside the DaisyUI drawer in
// app/dashboard/layout.tsx — always visible on lg+ screens, toggled via the
// hamburger on smaller ones. Active section is derived from the current path.
//
// `isAdmin` gates the Settings link (admin-only area, matching the redirect in
// app/dashboard/settings/layout.tsx).

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard/gantt",
    label: "Gantt",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6.75h10.5M3.75 12h13.5M3.75 17.25h7.5"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/projects",
    label: "Projects",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-.94-.94a2.25 2.25 0 0 0-1.59-.66H4.5A2.25 2.25 0 0 0 2.25 6.75V15a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 15V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a2.25 2.25 0 0 1-1.59-.66Z"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/my-tasks",
    label: "Tasks",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
        />
      </svg>
    ),
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    adminOnly: true,
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-5 h-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.241.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
        />
      </svg>
    ),
  },
];

// Close the mobile drawer after navigating (no-op on lg+ where it stays open).
const closeDrawer = () => {
  const toggle = document.getElementById(
    "dashboard-drawer"
  ) as HTMLInputElement | null;
  if (toggle) toggle.checked = false;
};

const DashboardSidebar = ({
  isAdmin,
  fullName,
}: {
  isAdmin: boolean;
  fullName: string | null;
}) => {
  const pathname = usePathname();

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="flex h-full min-h-screen w-64 flex-col bg-base-200 border-r border-base-300">
      <Link
        href="/dashboard/gantt"
        onClick={closeDrawer}
        className="flex items-center px-5 h-16 shrink-0"
      >
        <Image
          src="/streamline-logo.svg"
          alt={`${config.appName} logo`}
          width={185}
          height={28}
          className="h-5 w-auto"
          priority
        />
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-base-content/40">
          Workspace
        </p>
        <ul className="flex w-full flex-col gap-1">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeDrawer}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-base-content/70 hover:bg-base-100 hover:text-base-content"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="overflow-visible p-3 border-t border-base-300">
        <ButtonAccount displayName={fullName} />
      </div>
    </aside>
  );
};

export default DashboardSidebar;
