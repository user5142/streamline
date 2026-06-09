import { redirect } from "next/navigation";

// The dashboard has no standalone landing page — the company-wide Gantt is the
// default view. Anyone hitting /dashboard is sent straight there.
export default function Dashboard() {
  redirect("/dashboard/gantt");
}
