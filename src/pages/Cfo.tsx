import { Wallet } from "lucide-react";
import { ModulePlaceholder } from "@/components/layout/ModulePlaceholder";

export default function CfoPage() {
  return (
    <ModulePlaceholder
      icon={Wallet}
      title="Virtual CFO"
      description="P&L, cashflow, runway, debite și forecast — financiarul companiei într-un singur loc."
      wave={2}
      features={[
        "Revenue tracking pe sursă (B2C, Agent Hub, Partners SAAS)",
        "P&L automat cu marjă brută și netă pe linie de business",
        "Cashflow & runway în timp real, cu alertă la prag critic",
        "Facturi & debite per client, alerte automate scadență",
        "Forecast 3/6/12 luni cu sliders interactive (creștere, cost, hire)",
        "KPI financiari: CAC, LTV, payback, marjă · bugete pe departament",
      ]}
    />
  );
}
