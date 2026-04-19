import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Target, TrendingUp, Loader2, Filter } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { currentQuarter, useObjectives } from "@/hooks/useOkr";
import { ObjectiveDialog } from "@/components/okr/ObjectiveDialog";
import { ObjectiveCard } from "@/components/okr/ObjectiveCard";

const QUARTERS = (() => {
  const now = new Date();
  const year = now.getFullYear();
  const list: string[] = [];
  for (let y = year - 1; y <= year + 1; y++) {
    for (let q = 1; q <= 4; q++) list.push(`${y}-Q${q}`);
  }
  return list;
})();

export default function OkrPage() {
  const { hasRole } = useAuth();
  const canCreate = hasRole(["ceo", "executive", "manager"]);
  const [quarter, setQuarter] = useState<string>(currentQuarter());
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: objectives, isLoading } = useObjectives(quarter);

  const filtered = useMemo(() => {
    if (!objectives) return [];
    return objectives.filter((o) => {
      if (levelFilter !== "all" && o.level !== levelFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      return true;
    });
  }, [objectives, levelFilter, statusFilter]);

  const stats = useMemo(() => {
    const list = objectives ?? [];
    const total = list.length;
    const avgProgress =
      total > 0 ? Math.round(list.reduce((s, o) => s + o.progress, 0) / total) : 0;
    const onTrack = list.filter((o) => o.status === "on_track" || o.status === "completed").length;
    const totalKr = list.reduce((s, o) => s + o.key_results.length, 0);
    return { total, avgProgress, onTrack, totalKr };
  }, [objectives]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse-glow" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            OKR Engine
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">
              <span className="gradient-text">Objectives</span> & Key Results
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cascadă de obiective de la companie la individ · {stats.total} obiective ·{" "}
              {stats.totalKr} key results
            </p>
          </div>
          {canCreate && (
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Obiectiv nou
            </Button>
          )}
        </div>
      </motion.div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Total obiective" value={stats.total.toString()} icon={Target} />
        <StatTile
          label="Progres mediu"
          value={`${stats.avgProgress}%`}
          icon={TrendingUp}
          tone="primary"
        />
        <StatTile
          label="On track"
          value={`${stats.onTrack}/${stats.total}`}
          icon={Target}
          tone="success"
        />
        <StatTile label="Key Results" value={stats.totalKr.toString()} icon={Target} />
      </div>

      {/* Filters */}
      <div className="glass-card flex flex-wrap items-center gap-3 rounded-xl p-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="h-3.5 w-3.5" />
          <span className="font-semibold uppercase tracking-wider">Filtre</span>
        </div>

        <Select value={quarter} onValueChange={setQuarter}>
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {QUARTERS.map((q) => (
              <SelectItem key={q} value={q}>
                {q}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate nivelele</SelectItem>
            <SelectItem value="company">Companie</SelectItem>
            <SelectItem value="department">Departament</SelectItem>
            <SelectItem value="individual">Individual</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-36 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate statusurile</SelectItem>
            <SelectItem value="on_track">On track</SelectItem>
            <SelectItem value="at_risk">At risk</SelectItem>
            <SelectItem value="off_track">Off track</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState canCreate={canCreate} onCreate={() => setDialogOpen(true)} />
      ) : (
        <div className="space-y-3">
          {filtered.map((o, i) => (
            <ObjectiveCard key={o.id} objective={o} index={i} />
          ))}
        </div>
      )}

      <ObjectiveDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: typeof Target;
  tone?: "default" | "primary" | "success";
}) {
  const colors: Record<string, string> = {
    default: "text-foreground",
    primary: "gradient-text",
    success: "text-accent",
  };
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-start justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className={`mt-1.5 font-display text-2xl font-bold ${colors[tone]}`}>{value}</p>
    </div>
  );
}

function EmptyState({ canCreate, onCreate }: { canCreate: boolean; onCreate: () => void }) {
  return (
    <div className="glass-card flex flex-col items-center justify-center gap-4 rounded-xl p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-primary shadow-elegant">
        <Target className="h-6 w-6 text-primary-foreground" />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold">Niciun obiectiv pentru acest trimestru</h3>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {canCreate
            ? "Începe prin a defini primul obiectiv al companiei. Apoi cascadează către departamente."
            : "Aștepți ca un manager sau executive să creeze obiectivele trimestrului."}
        </p>
      </div>
      {canCreate && (
        <Button
          onClick={onCreate}
          className="bg-gradient-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Creează primul obiectiv
        </Button>
      )}
    </div>
  );
}
