import PromptAnalysisView from "@/components/PromptAnalysisView";
import { promptAnalysis } from "@/libs/promptAnalysis";

export const metadata = {
  title: "Prompt Analysis",
  robots: { index: false, follow: false },
};

export default function PromptAnalysisPage() {
  return <PromptAnalysisView data={promptAnalysis} />;
}
