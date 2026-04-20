import { useState, useMemo } from "react";
import { CalendarClock, Plus, Clock, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useCicles, type Meeting, type Cadence } from "@/hooks/useCicles";
import { MeetingDialog } from "@/components/cicles/MeetingDialog";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

const cadenceLabels: Record<Cadence, string> = {
  daily: "Daily Check-in",
  weekly: "Weekly Board",
  monthly: "Monthly Review",
  quarterly: "Quarterly Strategy",
};

const cadenceMinutes: Record<Cadence, number> = {
  daily: 15,
  weekly: 60,
  monthly: 120,
  quarterly: 240,
};

const statusColors: Record<string, string> = {
  scheduled: "bg-primary/15 text-primary border-primary/30",
  in_progress: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  completed: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  cancelled: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  scheduled: "Programat",
  in_progress: "În desfășurare",
  completed: "Finalizat",
  cancelled: "Anulat",
};

export default function CiclesPage() {
  const { meetings, loading } = useCicles();
  const [tab, setTab] = useState<Cadence | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);

  const filtered = useMemo(() => {
    if (tab === "all") return meetings;
    return meetings.filter((m) => m.cadence === tab);
  }, [meetings, tab]);

  const stats = useMemo(() => {
    const upcoming = meetings.filter((m) => m.status === "scheduled" && new Date(m.scheduled_at) > new Date()).length;
    const inProgress = meetings.filter((m) => m.status === "in_progress").length;
    const completed = meetings.filter((m) => m.status === "completed").length;
    return { upcoming, inProgress, completed };
  }, [meetings]);

  const openNew = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (m: Meeting) => {
    setEditing(m);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarClock className="h-7 w-7 text-primary" />
            CICLES™ — Ritmul de execuție
          </h1>
          <p className="text-muted-foreground mt-1">
            Cele 4 ritmuri ale companiei: daily, weekly, monthly și quarterly.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Meeting nou
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Programate
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.upcoming}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> În desfășurare
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.inProgress}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Finalizate
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.completed}</div></CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList>
          <TabsTrigger value="all">Toate</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Se încarcă...</p>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CalendarClock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Niciun meeting în această cadență. Apasă „Meeting nou" pentru a începe.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((m) => (
                <Card
                  key={m.id}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => openEdit(m)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{m.title}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {cadenceLabels[m.cadence]} · {m.duration_minutes || cadenceMinutes[m.cadence]} min
                        </p>
                      </div>
                      <Badge variant="outline" className={statusColors[m.status]}>
                        {statusLabels[m.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarClock className="h-4 w-4" />
                      {format(new Date(m.scheduled_at), "dd MMM yyyy, HH:mm", { locale: ro })}
                    </div>
                    {m.agenda && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{m.agenda}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <MeetingDialog open={dialogOpen} onOpenChange={setDialogOpen} meeting={editing} />
    </div>
  );
}
