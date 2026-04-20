import { useMemo, useState } from "react";
import { Plus, FolderKanban, Activity, CheckCircle2, FileEdit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects, type Project } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectDialog } from "@/components/projects/ProjectDialog";
import { MetricsDialog } from "@/components/projects/MetricsDialog";

export default function ProjectsPage() {
  const { projects, metrics, loading, syncMetrics } = useProjects();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [metricsOpen, setMetricsOpen] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [syncing, setSyncing] = useState(false);

  const metricsByProject = useMemo(() => {
    const map = new Map<string, typeof metrics>();
    metrics.forEach((m) => {
      const arr = map.get(m.project_id) ?? [];
      arr.push(m);
      map.set(m.project_id, arr);
    });
    return map;
  }, [metrics]);

  const filtered = filter === "all" ? projects : projects.filter((p) => p.status === filter);
  const stats = {
    total: projects.length,
    live: projects.filter((p) => p.status === "live").length,
    draft: projects.filter((p) => p.status === "draft").length,
    metrics: metrics.length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderKanban className="h-7 w-7 text-primary" /> Project Hub
          </h1>
          <p className="text-muted-foreground mt-1">Toate proiectele Lovable din ecosistemul EduForYou cu metrici live.</p>
        </div>
        <Button onClick={() => { setSelected(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Proiect nou
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Live</p>
              <p className="text-2xl font-bold">{stats.live}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <FileEdit className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Draft</p>
              <p className="text-2xl font-bold">{stats.draft}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Metrici tracked</p>
              <p className="text-2xl font-bold">{stats.metrics}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="all">Toate ({projects.length})</TabsTrigger>
          <TabsTrigger value="live">Live ({stats.live})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({stats.draft})</TabsTrigger>
          <TabsTrigger value="paused">Paused</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}
            </div>
          ) : filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">Niciun proiect în această categorie.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  metrics={metricsByProject.get(p.id) ?? []}
                  onEdit={() => { setSelected(p); setDialogOpen(true); }}
                  onMetrics={() => { setSelected(p); setMetricsOpen(true); }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} project={selected} />
      <MetricsDialog
        open={metricsOpen}
        onOpenChange={setMetricsOpen}
        project={selected}
        metrics={selected ? metricsByProject.get(selected.id) ?? [] : []}
      />
    </div>
  );
}
