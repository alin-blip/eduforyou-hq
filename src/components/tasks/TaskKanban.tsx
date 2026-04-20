import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./TaskCard";
import {
  useUpdateTask,
  type TaskStatus,
  type TaskWithRelations,
} from "@/hooks/useTasks";

const COLUMNS: { key: TaskStatus; label: string; accent: string }[] = [
  { key: "todo", label: "To Do", accent: "border-muted-foreground/30" },
  { key: "in_progress", label: "În lucru", accent: "border-primary/40" },
  { key: "blocked", label: "Blocat", accent: "border-destructive/40" },
  { key: "done", label: "Finalizat", accent: "border-success/40" },
];

interface Props {
  tasks: TaskWithRelations[];
  onTaskClick: (t: TaskWithRelations) => void;
  onAdd: (status: TaskStatus) => void;
}

export function TaskKanban({ tasks, onTaskClick, onAdd }: Props) {
  const update = useUpdateTask();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, TaskWithRelations[]>();
    COLUMNS.forEach((c) => map.set(c.key, []));
    tasks.forEach((t) => map.get(t.status)?.push(t));
    return map;
  }, [tasks]);

  const handleDrop = async (status: TaskStatus) => {
    setDropTarget(null);
    if (!draggingId) return;
    const task = tasks.find((t) => t.id === draggingId);
    setDraggingId(null);
    if (!task || task.status === status) return;
    await update.mutateAsync({ id: task.id, patch: { status } });
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = grouped.get(col.key) ?? [];
        const isOver = dropTarget === col.key;
        return (
          <div
            key={col.key}
            onDragOver={(e) => {
              e.preventDefault();
              setDropTarget(col.key);
            }}
            onDragLeave={() => setDropTarget((p) => (p === col.key ? null : p))}
            onDrop={() => handleDrop(col.key)}
            className={`flex flex-col rounded-xl border bg-card/30 p-3 transition-all ${col.accent} ${
              isOver ? "bg-primary/5 ring-2 ring-primary/30" : ""
            }`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {col.label}
                </span>
                <span className="rounded-full bg-muted/50 px-1.5 text-[10px] font-medium text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => onAdd(col.key)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/40 p-4 text-center text-[11px] text-muted-foreground">
                  Niciun task
                </p>
              ) : (
                items.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(t.id);
                    }}
                    onClick={() => onTaskClick(t)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
