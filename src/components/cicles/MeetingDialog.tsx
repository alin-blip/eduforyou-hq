import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2, CheckCircle2, Circle, AlertTriangle, FileText, Lightbulb, Target, UserPlus, Users } from "lucide-react";
import { useCicles, useMeetingDetail, type Meeting, type ItemKind, type ItemStatus, type Cadence, type MeetingStatus, type ParticipantStatus } from "@/hooks/useCicles";
import { useTeamMembers } from "@/hooks/useTeams";

const kindIcons: Record<ItemKind, any> = {
  agenda: FileText,
  decision: Lightbulb,
  action: Target,
  blocker: AlertTriangle,
  note: Circle,
};

const kindLabels: Record<ItemKind, string> = {
  agenda: "Agendă",
  decision: "Decizie",
  action: "Action",
  blocker: "Blocaj",
  note: "Notă",
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting: Meeting | null;
}

export function MeetingDialog({ open, onOpenChange, meeting }: Props) {
  const { createMeeting, updateMeeting } = useCicles();
  const { items, addItem, updateItem, deleteItem } = useMeetingDetail(meeting?.id ?? null);

  const [title, setTitle] = useState("");
  const [cadence, setCadence] = useState<Cadence>("weekly");
  const [status, setStatus] = useState<MeetingStatus>("scheduled");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState(60);
  const [agenda, setAgenda] = useState("");
  const [notes, setNotes] = useState("");
  const [decisions, setDecisions] = useState("");

  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemKind, setNewItemKind] = useState<ItemKind>("action");

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title);
      setCadence(meeting.cadence);
      setStatus(meeting.status);
      setScheduledAt(meeting.scheduled_at.slice(0, 16));
      setDuration(meeting.duration_minutes);
      setAgenda(meeting.agenda ?? "");
      setNotes(meeting.notes ?? "");
      setDecisions(meeting.decisions ?? "");
    } else {
      setTitle("");
      setCadence("weekly");
      setStatus("scheduled");
      setScheduledAt(new Date().toISOString().slice(0, 16));
      setDuration(60);
      setAgenda("");
      setNotes("");
      setDecisions("");
    }
  }, [meeting, open]);

  const handleSave = async () => {
    const payload = {
      title,
      cadence,
      status,
      scheduled_at: new Date(scheduledAt).toISOString(),
      duration_minutes: duration,
      agenda: agenda || null,
      notes: notes || null,
      decisions: decisions || null,
    };
    if (meeting) await updateMeeting(meeting.id, payload as any);
    else await createMeeting(payload as any);
    onOpenChange(false);
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    await addItem({ title: newItemTitle, kind: newItemKind });
    setNewItemTitle("");
  };

  const toggleItemStatus = async (id: string, current: ItemStatus) => {
    const next: ItemStatus = current === "done" ? "open" : "done";
    await updateItem(id, { status: next });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{meeting ? "Editează meeting" : "Meeting nou"}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Titlu</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Weekly Board" />
              </div>
              <div>
                <Label>Cadență</Label>
                <Select value={cadence} onValueChange={(v) => setCadence(v as Cadence)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily (15 min)</SelectItem>
                    <SelectItem value="weekly">Weekly (60 min)</SelectItem>
                    <SelectItem value="monthly">Monthly (120 min)</SelectItem>
                    <SelectItem value="quarterly">Quarterly (240 min)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as MeetingStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Programat</SelectItem>
                    <SelectItem value="in_progress">În desfășurare</SelectItem>
                    <SelectItem value="completed">Finalizat</SelectItem>
                    <SelectItem value="cancelled">Anulat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data & ora</Label>
                <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              </div>
              <div>
                <Label>Durată (min)</Label>
                <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              </div>
              <div className="col-span-2">
                <Label>Agendă</Label>
                <Textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} rows={3} placeholder="Subiectele întâlnirii..." />
              </div>
              <div className="col-span-2">
                <Label>Notițe</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Ce s-a discutat..." />
              </div>
              <div className="col-span-2">
                <Label>Decizii</Label>
                <Textarea value={decisions} onChange={(e) => setDecisions(e.target.value)} rows={2} placeholder="Ce s-a decis..." />
              </div>
            </div>

            {meeting && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-3">Agenda & Action items</h3>
                  <div className="flex gap-2 mb-3">
                    <Select value={newItemKind} onValueChange={(v) => setNewItemKind(v as ItemKind)}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(kindLabels).map(([k, l]) => (
                          <SelectItem key={k} value={k}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={newItemTitle}
                      onChange={(e) => setNewItemTitle(e.target.value)}
                      placeholder="Adaugă un item..."
                      onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                    />
                    <Button onClick={handleAddItem} size="icon"><Plus className="h-4 w-4" /></Button>
                  </div>

                  <div className="space-y-2">
                    {items.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Niciun item încă.</p>
                    )}
                    {items.map((item) => {
                      const Icon = kindIcons[item.kind];
                      const isDone = item.status === "done";
                      return (
                        <div key={item.id} className="flex items-center gap-2 p-2 rounded-md border bg-card/50">
                          <Checkbox checked={isDone} onCheckedChange={() => toggleItemStatus(item.id, item.status)} />
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <Badge variant="outline" className="text-xs">{kindLabels[item.kind]}</Badge>
                          <span className={`flex-1 text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>
                            {item.title}
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Anulează</Button>
          <Button onClick={handleSave}>{meeting ? "Salvează" : "Creează"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
