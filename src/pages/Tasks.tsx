import { CheckSquare } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function TasksPage() {
  return (
    <ModulePlaceholder
      icon={CheckSquare}
      title="Tasks & Projects"
      description="Lanțul de execuție: de la strategie la task-ul pe care cineva îl bifează azi."
      wave={2}
      features={[
        "Task-uri legate direct de KPI și Key Results",
        "Status, prioritate, asignat, deadline, ore estimate",
        "Vizualizare Kanban + List + Calendar",
        "Filtre pe departament, owner, proiect, prioritate",
        "Notificări inteligente pentru blocaje și deadline-uri",
      ]}
    />
  );
}
