import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useProjects, type Project, type ProjectMetric } from "@/hooks/useProjects";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
  metrics: ProjectMetric[];
}

export function MetricsDialog({ open, onOpenChange, project, metrics }: Props) {
  const { upsertMetric, deleteMetric } = useProjects();
  const [label, setLabel] = useState("");
  const [metricKey, setMetricKey] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [delta, setDelta] = useState("");
  const [trend, setTrend] = useState<string>("flat");

  const handleAdd = async () => {
    if (!project || !label || !value) return;
    await upsertMetric({
      project_id: project.id,
      metric_key: metricKey || label.toLowerCase().replace(/\s+/g, "_"),
      label,
      value: Number(value),
      unit: unit || null,
      delta_pct: delta ? Number(delta) : null,
      trend,
      position: metrics.length,
    });
    setLabel(""); setMetricKey(""); setValue(""); setUnit(""); setDelta(""); setTrend("flat");
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Metrici · {project.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border p-3 space-y-2 bg-muted/20">
            <p className="text-sm font-medium">Adaugă / actualizează metrică</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="MRR, Agenți..." />
              </div>
              <div>
                <Label className="text-xs">Cheie (opțional)</Label>
                <Input value={metricKey} onChange={(e) => setMetricKey(e.target.value)} placeholder="auto" />
              </div>
              <div>
                <Label className="text-xs">Valoare</Label>
                <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Unitate</Label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="€, %, agenți" />
              </div>
              <div>
                <Label className="text-xs">Delta %</Label>
                <Input type="number" value={delta} onChange={(e) => setDelta(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Trend</Label>
                <Select value={trend} onValueChange={setTrend}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="up">Up</SelectItem>
                    <SelectItem value="down">Down</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAdd} size="sm" disabled={!label || !value}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Salvează
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Metrici existente ({metrics.length})</p>
            {metrics.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nicio metrică încă.</p>}
            {metrics.map((m) => {
              const TrendIcon = m.trend === "up" ? TrendingUp : m.trend === "down" ? TrendingDown : Minus;
              return (
                <div key={m.id} className="flex items-center gap-2 p-2 rounded-md border bg-card/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.metric_key}</p>
                  </div>
                  <span className="font-mono text-sm">
                    {Number(m.value).toLocaleString("ro-RO")}{m.unit && ` ${m.unit}`}
                  </span>
                  {m.delta_pct !== null && (
                    <Badge variant="outline" className="gap-1">
                      <TrendIcon className="h-3 w-3" />{Math.abs(Number(m.delta_pct)).toFixed(1)}%
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteMetric(m.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Închide</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
