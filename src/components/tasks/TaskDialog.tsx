import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useKeyResultsList,
  type Task,
  type TaskInsert,
  type TaskPriority,
  type TaskStatus,
} from "@/hooks/useTasks";
import { useDepartments, useProfiles } from "@/hooks/useOkr";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  task?: Task | null;
  defaultStatus?: TaskStatus;
}

const STATUSES: TaskStatus[] = ["todo", "in_progress", "blocked", "done"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

export function TaskDialog({ open, onOpenChange, task, defaultStatus = "todo" }: Props) {
  const create = useCreateTask();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const { data: departments = [] } = useDepartments();
  const { data: profiles = [] } = useProfiles();
  const { data: krs = [] } = useKeyResultsList();

  const [form, setForm] = useState<TaskInsert>({
    title: "",
    description: "",
    status: defaultStatus,
    priority: "medium",
    assignee_id: null,
    department_id: null,
    key_result_id: null,
    due_date: null,
    estimated_hours: null,
  });

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        assignee_id: task.assignee_id,
        department_id: task.department_id,
        key_result_id: task.key_result_id,
        due_date: task.due_date,
        estimated_hours: task.estimated_hours,
      });
    } else {
      setForm({
        title: "",
        description: "",
        status: defaultStatus,
        priority: "medium",
        assignee_id: null,
        department_id: null,
        key_result_id: null,
        due_date: null,
        estimated_hours: null,
      });
    }
  }, [task, defaultStatus, open]);

  const submit = async () => {
    if (!form.title?.trim()) {
      toast.error("Titlul e obligatoriu");
      return;
    }
    try {
      if (task) {
        await update.mutateAsync({ id: task.id, patch: form });
        toast.success("Task actualizat");
      } else {
        await create.mutateAsync(form);
        toast.success("Task creat");
      }
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Eroare la salvare");
    }
  };

  const remove = async () => {
    if (!task) return;
    if (!confirm("Ștergi acest task?")) return;
    try {
      await del.mutateAsync(task.id);
      toast.success("Task șters");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Eroare");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">{task ? "Editează task" : "Task nou"}</DialogTitle>
          <DialogDescription>
            Leagă-l de un Key Result sau departament pentru tracking strategic.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Titlu</Label>
            <Input
              value={form.title ?? ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Trimite propunere către client X"
            />
          </div>

          <div className="grid gap-2">
            <Label>Descriere</Label>
            <Textarea
              rows={3}
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalii, context, criterii de succes…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select
                value={form.status ?? "todo"}
                onValueChange={(v) => setForm({ ...form, status: v as TaskStatus })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Prioritate</Label>
              <Select
                value={form.priority ?? "medium"}
                onValueChange={(v) => setForm({ ...form, priority: v as TaskPriority })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Responsabil</Label>
              <Select
                value={form.assignee_id ?? "none"}
                onValueChange={(v) => setForm({ ...form, assignee_id: v === "none" ? null : v })}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nimeni</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Departament</Label>
              <Select
                value={form.department_id ?? "none"}
                onValueChange={(v) => setForm({ ...form, department_id: v === "none" ? null : v })}
              >
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Key Result asociat</Label>
            <Select
              value={form.key_result_id ?? "none"}
              onValueChange={(v) => setForm({ ...form, key_result_id: v === "none" ? null : v })}
            >
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {krs.map((k) => (
                  <SelectItem key={k.id} value={k.id}>{k.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !form.due_date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {form.due_date ? format(new Date(form.due_date), "PPP") : "Alege data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={form.due_date ? new Date(form.due_date) : undefined}
                    onSelect={(d) =>
                      setForm({ ...form, due_date: d ? format(d, "yyyy-MM-dd") : null })
                    }
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label>Ore estimate</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={form.estimated_hours ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    estimated_hours: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="Ex: 4"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <div>
            {task && (
              <Button variant="ghost" size="sm" className="text-destructive" onClick={remove}>
                <Trash2 className="mr-1.5 h-4 w-4" /> Șterge
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Anulează</Button>
            <Button
              onClick={submit}
              disabled={create.isPending || update.isPending}
              className="bg-gradient-primary"
            >
              {task ? "Salvează" : "Creează task"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
