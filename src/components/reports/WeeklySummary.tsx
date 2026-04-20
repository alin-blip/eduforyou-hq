import { Sparkles, Trophy, AlertTriangle, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export type WeeklyReport = {
  executive_summary: string;
  wins: string[];
  concerns: string[];
  top_performer: { department: string; reason: string };
  underperformer: { department: string; reason: string; recommendation: string };
  priorities_next_week: { title: string; owner_hint: string; impact: "low" | "medium" | "high" }[];
};

const impactClass = {
  low: "border-muted text-muted-foreground",
  medium: "border-primary/40 text-primary",
  high: "border-destructive/40 text-destructive",
};

export function WeeklySummary({
  report,
  loading,
  generatedAt,
}: {
  report: WeeklyReport | null;
  loading: boolean;
  generatedAt: string | null;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!report) {
    return (
      <Card className="p-12 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-primary/60 mb-3" />
        <h3 className="font-semibold mb-1">Generează AI Weekly Summary</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Analizează snapshot-ul real (financiar + performanță departamente) și produce un brief executiv cu top
          performer, riscuri și priorități pentru săptămâna următoare.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Headline */}
      <Card className="p-5 bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            Executive Summary
          </span>
          {generatedAt && (
            <span className="ml-auto text-[10px] text-muted-foreground">
              {new Date(generatedAt).toLocaleString("ro-RO")}
            </span>
          )}
        </div>
        <p className="text-sm leading-relaxed">{report.executive_summary}</p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold">Wins săptămâna aceasta</h3>
          </div>
          <ul className="space-y-2">
            {report.wins.map((w, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold">Riscuri & probleme</h3>
          </div>
          <ul className="space-y-2">
            {report.concerns.map((c, i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 border-emerald-500/30 bg-emerald-500/5">
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">
              Top performer
            </span>
          </div>
          <p className="text-base font-semibold mb-1">{report.top_performer.department}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{report.top_performer.reason}</p>
        </Card>

        <Card className="p-5 border-destructive/30 bg-destructive/5">
          <div className="mb-2 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-destructive" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-destructive">
              Necesită atenție
            </span>
          </div>
          <p className="text-base font-semibold mb-1">{report.underperformer.department}</p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">{report.underperformer.reason}</p>
          <div className="rounded-md bg-background/60 p-2 text-xs">
            <span className="font-semibold text-destructive">Recomandare: </span>
            {report.underperformer.recommendation}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <ArrowRight className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Priorități săptămâna următoare</h3>
        </div>
        <div className="space-y-2">
          {report.priorities_next_week.map((p, i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-border/40 p-3 hover:bg-card/40 transition-colors"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{p.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Owner sugerat: {p.owner_hint}</p>
              </div>
              <Badge variant="outline" className={`shrink-0 text-[10px] ${impactClass[p.impact]}`}>
                {p.impact}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
