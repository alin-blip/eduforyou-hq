import { FolderKanban } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function ProjectsPage() {
  return (
    <ModulePlaceholder
      icon={FolderKanban}
      title="Project Hub"
      description="Toate proiectele Lovable din ecosistemul EduForYou: status, owner, KPI cheie."
      wave={2}
      features={[
        "Carduri pentru EduForYou main, Agent Hub, Partners SAAS, Webinar, Hub-uri",
        "Status (live/draft), URL public, owner, ultima actualizare",
        "KPI cheie pe proiect (agenți, parteneri, înscrieri, MRR)",
        "Sincronizare manuală metrici · webhook-uri în Val 3",
        "Quick links pentru editare în Lovable",
      ]}
    />
  );
}
