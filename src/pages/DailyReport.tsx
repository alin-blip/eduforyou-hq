import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Lock, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useDailyReports, useUpsertDailyReport, useSubmitDailyReport, type DailyReport } from "@/hooks/useDailyReports";
import { cn } from "@/lib/utils";

const TARGET_CALLS = 30;
const RED_CALLS = 15;

function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as { id: string; full_name: string | null; email: string | null }[];
    },
    staleTime: 5 * 60_000,
  });
}

export default function DailyReportPage() {
  const { user, isAdmin, hasRole } = useAuth();
  const isManager = isAdmin || hasRole("manager");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: members = [], isLoading: loadingMembers } = useTeamMembers();
  const { data: reports = [], isLoading } = useDailyReports(date);

  const visible = useMemo(() => {
    if (isManager) return members;
    return members.filter((m) => m.id === user?.id);
  }, [members, user?.id, isManager]);

  return (
    <div className="space-y-6 p-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Daily Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Raport zilnic per consultant. Apeluri ≥ {TARGET_CALLS} = verde, &lt; {RED_CALLS} = roșu.
          </p>
        </div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full max-w-xs" />
      </header>

      {isLoading || loadingMembers ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((m) => (
            <DailyRow
              key={m.id}
              userId={m.id}
              displayName={m.full_name || m.email || "—"}
              date={date}
              report={reports.find((r) => r.user_id === m.id) ?? null}
              canEdit={isManager || m.id === user?.id}
            />
          ))}
          {visible.length === 0 && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Niciun membru.</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}

function DailyRow({
  userId,
  displayName,
  date,
  report,
  canEdit,
}: {
  userId: string;
  displayName: string;
  date: string;
  report: DailyReport | null;
  canEdit: boolean;
}) {
  const upsert = useUpsertDailyReport();
  const submit = useSubmitDailyReport();
  const [r, setR] = useState({
    calls_made: report?.calls_made ?? 0,
    leads_contacted: report?.leads_contacted ?? 0,
    leads_qualified: report?.leads_qualified ?? 0,
    documents_collected: report?.documents_collected ?? 0,
    applications_submitted: report?.applications_submitted ?? 0,
    students_enrolled: report?.students_enrolled ?? 0,
    blockers: report?.blockers ?? "",
    notes: report?.notes ?? "",
  });
  const locked = report?.locked ?? false;
  const callTone = r.calls_made >= TARGET_CALLS ? "bg-success/10 border-success" : r.calls_made < RED_CALLS ? "bg-destructive/10 border-destructive" : "";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">{displayName}</CardTitle>
        <div className="flex items-center gap-2">
          {locked && <Badge variant="secondary"><Lock className="mr-1 h-3 w-3" /> Blocat</Badge>}
          {report?.submitted_at && <span className="text-xs text-muted-foreground">Submited: {new Date(report.submitted_at).toLocaleString("ro-RO")}</span>}
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
        <NumField label="Apeluri" value={r.calls_made} onChange={(v) => setR((p) => ({ ...p, calls_made: v }))} disabled={!canEdit || locked} className={callTone} />
        <NumField label="Lead contactat" value={r.leads_contacted} onChange={(v) => setR((p) => ({ ...p, leads_contacted: v }))} disabled={!canEdit || locked} />
        <NumField label="Lead calificat" value={r.leads_qualified} onChange={(v) => setR((p) => ({ ...p, leads_qualified: v }))} disabled={!canEdit || locked} />
        <NumField label="Documente" value={r.documents_collected} onChange={(v) => setR((p) => ({ ...p, documents_collected: v }))} disabled={!canEdit || locked} />
        <NumField label="Aplicații" value={r.applications_submitted} onChange={(v) => setR((p) => ({ ...p, applications_submitted: v }))} disabled={!canEdit || locked} />
        <NumField label="Înrolați" value={r.students_enrolled} onChange={(v) => setR((p) => ({ ...p, students_enrolled: v }))} disabled={!canEdit || locked} />
        <div className="lg:col-span-7 grid gap-3 lg:grid-cols-2">
          <Textarea placeholder="Blocaje" value={r.blockers} onChange={(e) => setR((p) => ({ ...p, blockers: e.target.value }))} disabled={!canEdit || locked} />
          <Textarea placeholder="Note" value={r.notes} onChange={(e) => setR((p) => ({ ...p, notes: e.target.value }))} disabled={!canEdit || locked} />
        </div>
        {canEdit && !locked && (
          <div className="lg:col-span-7 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => upsert.mutate({ user_id: userId, report_date: date, ...r })}>
              <Save className="mr-2 h-4 w-4" /> Salvează
            </Button>
            <Button size="sm" disabled={!report} onClick={() => report && submit.mutate(report.id)}>
              <Lock className="mr-2 h-4 w-4" /> Submit & Lock
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NumField({ label, value, onChange, disabled, className }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean; className?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        disabled={disabled}
        className={cn("text-right tabular-nums", className)}
      />
    </div>
  );
}
