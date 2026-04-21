import { useState } from "react";
import { Sparkles, TrendingDown, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Reason = {
  title: string;
  percentage: number;
  example: string;
  recommendation: string;
};

type InsightsResult = {
  insights: Reason[];
  total_analyzed: number;
  sampled: number;
  generated_at: string;
  message?: string;
};

export function OpsAiInsights() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InsightsResult | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("ai-ops-insights");
      if (error) throw error;
      if (res?.error) throw new Error(res.error);
      setData(res as InsightsResult);
      if ((res as InsightsResult).insights.length === 0 && (res as InsightsResult).message) {
        toast.info((res as InsightsResult).message!);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Top motive de refuz — ultima lună
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            Analiză AI pe notițele consultanților din lead-uri descalificate.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={run} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          {data ? "Re-analizează" : "Analizează"}
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !data && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        )}
        {!loading && !data && (
          <p className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            Apasă "Analizează" pentru a extrage automat top 5 motive de refuz din notițele consultanților.
          </p>
        )}
        {data && data.insights.length === 0 && (
          <p className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {data.message ?? "Nicio notiță analizabilă."}
          </p>
        )}
        {data && data.insights.length > 0 && (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              Analizate <b>{data.sampled}</b> notițe · generat {new Date(data.generated_at).toLocaleString("ro-RO")}
            </p>
            <ol className="space-y-3">
              {data.insights.map((r, i) => (
                <li key={i} className="rounded-md border bg-muted/30 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h4 className="flex items-center gap-2 text-sm font-semibold">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      {i + 1}. {r.title}
                    </h4>
                    <Badge variant="secondary" className="tabular-nums">{r.percentage}%</Badge>
                  </div>
                  <p className="mb-2 text-xs italic text-muted-foreground">"{r.example}"</p>
                  <p className="text-xs">
                    <span className="font-semibold text-primary">→ </span>{r.recommendation}
                  </p>
                </li>
              ))}
            </ol>
          </>
        )}
      </CardContent>
    </Card>
  );
}
