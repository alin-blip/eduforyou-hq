import { useEffect, useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const DAYS = [
  { value: "1", label: "Luni" },
  { value: "2", label: "Marți" },
  { value: "3", label: "Miercuri" },
  { value: "4", label: "Joi" },
  { value: "5", label: "Vineri" },
  { value: "6", label: "Sâmbătă" },
  { value: "0", label: "Duminică" },
];

interface Schedule {
  day_of_week: number;
  hour: number;
  minute: number;
  active: boolean;
  updated_at?: string;
}

export function ReportScheduleCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>({
    day_of_week: 1,
    hour: 8,
    minute: 0,
    active: true,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.rpc("get_weekly_report_schedule");
      if (cancelled) return;
      if (error || (data as any)?.error) {
        toast.error("Nu am putut încărca programarea raportului");
      } else if (data) {
        const d = data as any;
        setSchedule({
          day_of_week: Number(d.day_of_week ?? 1),
          hour: Number(d.hour ?? 8),
          minute: Number(d.minute ?? 0),
          active: Boolean(d.active ?? true),
          updated_at: d.updated_at,
        });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.rpc("update_weekly_report_schedule", {
        _day_of_week: schedule.day_of_week,
        _hour: schedule.hour,
        _minute: schedule.minute,
        _active: schedule.active,
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(
        schedule.active
          ? `Programare salvată: ${DAYS.find((d) => d.value === String(schedule.day_of_week))?.label} la ${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")}`
          : "Trimiterea automată a fost dezactivată"
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  };

  const timeStr = `${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")}`;
  const dayLabel = DAYS.find((d) => d.value === String(schedule.day_of_week))?.label ?? "—";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <CalendarClock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Programare raport săptămânal</CardTitle>
            <CardDescription>
              Când să fie generat și trimis automat raportul executiv (CEO / Executive / Manageri).
              Ora este în UTC.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Trimitere automată</p>
                <p className="text-xs text-muted-foreground">
                  {schedule.active ? `Activă · ${dayLabel} la ${timeStr} UTC` : "Dezactivată"}
                </p>
              </div>
              <Switch
                checked={schedule.active}
                onCheckedChange={(v) => setSchedule({ ...schedule, active: v })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Ziua săptămânii</Label>
                <Select
                  value={String(schedule.day_of_week)}
                  onValueChange={(v) => setSchedule({ ...schedule, day_of_week: Number(v) })}
                  disabled={!schedule.active}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ora (UTC)</Label>
                <Input
                  type="number"
                  min={0}
                  max={23}
                  value={schedule.hour}
                  onChange={(e) => {
                    const n = Math.max(0, Math.min(23, Number(e.target.value) || 0));
                    setSchedule({ ...schedule, hour: n });
                  }}
                  disabled={!schedule.active}
                />
              </div>
              <div className="space-y-2">
                <Label>Minutul</Label>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  step={5}
                  value={schedule.minute}
                  onChange={(e) => {
                    const n = Math.max(0, Math.min(59, Number(e.target.value) || 0));
                    setSchedule({ ...schedule, minute: n });
                  }}
                  disabled={!schedule.active}
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Notă: ora curentă locală este{" "}
              <span className="font-mono">
                {new Date().toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
              </span>{" "}
              ({Intl.DateTimeFormat().resolvedOptions().timeZone}). Cron-ul rulează în UTC,
              deci ajustează ora dacă vrei o oră specifică în fusul tău.
            </p>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Se salvează...</>
                ) : (
                  "Salvează programare"
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
