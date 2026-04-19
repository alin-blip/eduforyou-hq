import { AlertTriangle, Bell, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertItem {
  type: "danger" | "warning" | "success" | "info";
  title: string;
  description: string;
  time: string;
}

const alerts: AlertItem[] = [
  {
    type: "danger",
    title: "Burn rate peste prag",
    description: "Cheltuieli +18% vs buget Marketing",
    time: "acum 2h",
  },
  {
    type: "warning",
    title: "OKR Sales sub țintă",
    description: "Q4 — 65% completion la 70% timp scurs",
    time: "acum 5h",
  },
  {
    type: "success",
    title: "Agent Hub: milestone atins",
    description: "187 agenți activi (+15 săpt. asta)",
    time: "ieri",
  },
  {
    type: "info",
    title: "Weekly Board la 10:00",
    description: "Mâine — agenda generată automat",
    time: "azi",
  },
];

const iconMap = {
  danger: { icon: AlertTriangle, color: "text-destructive bg-destructive/15" },
  warning: { icon: Clock, color: "text-warning bg-warning/15" },
  success: { icon: CheckCircle2, color: "text-accent bg-accent/15" },
  info: { icon: Bell, color: "text-primary bg-primary/15" },
};

export function AlertsFeed() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold">Alerte & Notificări</h3>
          <p className="text-xs text-muted-foreground">Semnalele care contează</p>
        </div>
      </div>
      <ul className="space-y-2">
        {alerts.map((a, idx) => {
          const { icon: Icon, color } = iconMap[a.type];
          return (
            <li
              key={idx}
              className="flex items-start gap-3 rounded-lg border border-border/40 bg-card/40 p-3 transition-colors hover:border-border hover:bg-card/70"
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  color,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  <span className="text-[10px] text-muted-foreground">{a.time}</span>
                </div>
                <p className="text-xs text-muted-foreground">{a.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
