export interface PromptAnalysis {
  title: string;
  subtitle: string;
  stats: {
    totalPrompts: number;
    buildDuration: string;
    featuresShipped: string;
  };
  pitch: string;
  shipped: string[];
  aiApproach: string[];
  takeaway: string;
}

export const promptAnalysis: PromptAnalysis = {
  title: "Streamline",
  subtitle: "AI hackathon build · 50 prompts · 2 days",
  stats: {
    totalPrompts: 50,
    buildDuration: "2 days",
    featuresShipped: "Full MVP",
  },
  pitch:
    "Project management for people who manage projects as part of their job — not their job title. Lighter than Jira, with a company-wide Gantt view.",
  shipped: [
    "Email/password auth & org onboarding",
    "Invite teammates by link",
    "Teams, projects, tasks & action items",
    "Gantt chart with team & person filters",
    "Deployed at streamlineprojects.co",
  ],
  aiApproach: [
    "Requirements doc first, then 7 implementation chunks",
    "AI pair-programmed — I steered product decisions, pasted errors, iterated on design",
    "Every prompt logged in PROMPTS.md",
  ],
  takeaway:
    "AI didn't replace the thinking — it compressed the building. Scope, judgment, and a clear requirements doc still mattered.",
};
