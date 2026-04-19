import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function TeamsPage() {
  return (
    <ModulePlaceholder
      icon={Users}
      title="Teams & Workload"
      description="Organigrama, capacitatea fiecărui membru și ce lucrează echipele tale chiar acum."
      wave={2}
      features={[
        "Vizualizare organigramă pe departamente cu manageri și executivi",
        "Workload pe membru: task-uri active vs ore disponibile",
        '"What is X working on" — feed live al activității săptămânale',
        "Alerte de overload și sub-utilizare automate",
        "Profil membru cu rol, salariu (privat), KPI și OKR atribuite",
      ]}
    />
  );
}
