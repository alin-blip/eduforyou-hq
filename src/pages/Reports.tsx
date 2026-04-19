import { BarChart3 } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      icon={BarChart3}
      title="360° Comparison & Reports"
      description="Snapshots lunare, comparații istoric și board reports auto-generate."
      wave={3}
      features={[
        "Snapshot lunar: PACE score, financials, OKR completion, marketing",
        "Comparație lună-pe-lună și trimestru-pe-trimestru",
        "Export PDF Board Report pentru investitori și advisors",
        "AI Insights cu Lovable AI — rezumat săptămânal automat",
        "Alerte pe schimbări semnificative (anomaly detection)",
      ]}
    />
  );
}
