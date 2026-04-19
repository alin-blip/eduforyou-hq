import { DollarSign, TrendingUp, Target, Users, Activity, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

import { PaceScore } from "@/components/dashboard/PaceScore";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DepartmentHeatmap } from "@/components/dashboard/DepartmentHeatmap";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ProjectQuickLinks } from "@/components/dashboard/ProjectQuickLinks";
import { AlertsFeed } from "@/components/dashboard/AlertsFeed";

const Index = () => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            CEO Cockpit · live
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Bună dimineața, <span className="gradient-text">Cătălin</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Iată unde se află EduForYou astăzi · 3 alerte necesită atenția ta
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <PaceScore
            score={74}
            breakdown={[
              { label: "Planning", value: 82 },
              { label: "Alignment", value: 68 },
              { label: "Coordination", value: 76 },
              { label: "Evaluation", value: 70 },
            ]}
          />
        </div>
        <div className="grid grid-cols-2 gap-4 lg:col-span-4">
          <KpiCard
            label="Revenue MTD"
            value="€95k"
            delta={12.4}
            hint="Target €110k"
            icon={DollarSign}
            tone="success"
            index={0}
          />
          <KpiCard
            label="Burn Rate"
            value="€50k"
            delta={-3.2}
            hint="Runway 14 luni"
            icon={TrendingUp}
            tone="warning"
            index={1}
          />
          <KpiCard
            label="OKR Compl."
            value="71%"
            delta={5.1}
            hint="Q4 în desfășurare"
            icon={Target}
            tone="default"
            index={2}
          />
          <KpiCard
            label="Tasks Overdue"
            value="14"
            delta={-22}
            hint="Din 187 active"
            icon={AlertCircle}
            tone="danger"
            index={3}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <RevenueChart />
        </div>
        <div className="lg:col-span-5">
          <AlertsFeed />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <DepartmentHeatmap />
        </div>
        <div className="lg:col-span-5">
          <ProjectQuickLinks />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Echipă activă" value="38" icon={Users} hint="3 departamente" index={0} />
        <KpiCard label="MRR" value="€78k" delta={8.2} icon={Activity} tone="success" index={1} />
        <KpiCard label="CAC" value="€142" delta={-4.5} icon={Target} tone="success" index={2} />
        <KpiCard label="LTV / CAC" value="4.8x" delta={2.1} icon={TrendingUp} tone="default" index={3} />
      </div>
    </div>
  );
};

export default Index;
