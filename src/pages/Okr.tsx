import { Target } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function OkrPage() {
  return (
    <ModulePlaceholder
      icon={Target}
      title="OKR & KPI Engine"
      description="Cascadă de obiective de la companie la individ, cu key results, progres și threshold-uri vizuale."
      wave={2}
      features={[
        "Obiective companie → departament → individual cu aliniere vizuală",
        "Key Results cu owner, progres %, due date și check-in săptămânal",
        "KPI cards cu target, actual, trend și threshold roșu/galben/verde",
        "Istoric și forecast cu line chart pe trimestre",
        "Vedere de ansamblu: ce contribuie fiecare la obiectivele companiei",
      ]}
    />
  );
}
