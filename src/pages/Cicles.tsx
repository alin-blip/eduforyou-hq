import { CalendarClock } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function CiclesPage() {
  return (
    <ModulePlaceholder
      icon={CalendarClock}
      title="CICLES™ — Ritmul de execuție"
      description="Cele 4 ritmuri ale companiei: zilnic, săptămânal, lunar și trimestrial."
      wave={2}
      features={[
        "Daily Check-in (15 min) — ieri, azi, blocaje pentru fiecare membru",
        "Weekly Board (60 min) — review KPI, decizii și action items",
        "Monthly KPI Review (120 min) — analiză performanță, ajustări OKR",
        "Quarterly Strategy (240 min) — scor PACE și planning trimestru",
        "Notificări automate, template-uri și istoric meeting notes",
      ]}
    />
  );
}
