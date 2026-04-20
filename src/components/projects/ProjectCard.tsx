import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Edit, BarChart3, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ro } from "date-fns/locale";
import type { Project, ProjectMetric } from "@/hooks/useProjects";

const statusConfig: Record<string, { label: string; className: string }> = {
  live: { label: "Live", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-border" },
  paused: { label: "Paused", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  archived: { label: "Archived", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

interface Props {
  project: Project;
  metrics: ProjectMetric[];
  onEdit: () => void;
  onMetrics: () => void;
}

export function ProjectCard({ project, metrics, onEdit, onMetrics }: Props) {
  const Icon = (LucideIcons as any)[project.icon ?? "FolderKanban"] ?? LucideIcons.FolderKanban;
  const status = statusConfig[project.status] ?? statusConfig.draft;
  const topMetrics = metrics.slice(0, 3);

  const lastSync = metrics.length > 0
    ? metrics.reduce((latest, m) => {
        const t = new Date(m.recorded_at).getTime();
        return t > latest ? t : latest;
      }, 0)
    : null;
  const lastSyncLabel = lastSync
    ? formatDistanceToNow(new Date(lastSync), { addSuffix: true, locale: ro })
    : null;

  return (
    <Card className="p-5 group hover:border-primary/50 transition-all bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold leading-tight">{project.name}</h3>
            {project.category && (
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{project.category}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className={status.className}>{status.label}</Badge>
      </div>

      {project.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description}</p>
      )}

      {topMetrics.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {topMetrics.map((m) => {
            const TrendIcon = m.trend === "up" ? TrendingUp : m.trend === "down" ? TrendingDown : Minus;
            const trendColor = m.trend === "up" ? "text-emerald-400" : m.trend === "down" ? "text-destructive" : "text-muted-foreground";
            return (
              <div key={m.id} className="rounded-lg bg-muted/30 p-2 border border-border/50">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{m.label}</p>
                <p className="font-semibold text-sm mt-0.5">
                  {Number(m.value).toLocaleString("ro-RO")}
                  {m.unit && <span className="text-xs text-muted-foreground ml-0.5">{m.unit}</span>}
                </p>
                {m.delta_pct !== null && (
                  <div className={`flex items-center gap-0.5 text-[10px] ${trendColor}`}>
                    <TrendIcon className="h-2.5 w-2.5" />
                    {Math.abs(Number(m.delta_pct)).toFixed(1)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg bg-muted/20 border border-dashed border-border p-3 mb-4 text-center">
          <p className="text-xs text-muted-foreground">Nicio metrică încă</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={onMetrics}>
          <BarChart3 className="h-3.5 w-3.5 mr-1.5" /> Metrici
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-3.5 w-3.5" />
        </Button>
        {project.public_url && (
          <Button variant="outline" size="sm" asChild>
            <a href={project.public_url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}
