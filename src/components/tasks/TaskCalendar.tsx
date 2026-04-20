import { useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { TaskPriority, TaskWithRelations } from "@/hooks/useTasks";

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-muted-foreground",
  medium: "bg-primary",
  high: "bg-warning",
  urgent: "bg-destructive",
};

interface Props {
  tasks: TaskWithRelations[];
  onTaskClick: (t: TaskWithRelations) => void;
}

export function TaskCalendar({ tasks, onTaskClick }: Props) {
  const [cursor, setCursor] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const arr: Date[] = [];
    let d = start;
    while (d <= end) {
      arr.push(d);
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    return arr;
  }, [cursor]);

  const tasksByDay = useMemo(() => {
    const map = new Map<string, TaskWithRelations[]>();
    tasks.forEach((t) => {
      if (!t.due_date) return;
      const key = t.due_date;
      const arr = map.get(key) ?? [];
      arr.push(t);
      map.set(key, arr);
    });
    return map;
  }, [tasks]);

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{format(cursor, "MMMM yyyy")}</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Azi
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor(subMonths(cursor, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCursor(addMonths(cursor, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-border/40 bg-border/40 text-xs">
        {["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"].map((d) => (
          <div key={d} className="bg-card/60 p-2 text-center font-semibold uppercase tracking-widest text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, cursor);
          const today = isSameDay(day, new Date());
          return (
            <div
              key={key}
              className={cn(
                "min-h-[96px] bg-card/40 p-1.5",
                !inMonth && "opacity-40",
                today && "bg-primary/5 ring-1 ring-primary/30",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className={cn("text-[11px] font-medium", today && "text-primary")}>
                  {format(day, "d")}
                </span>
                {dayTasks.length > 0 && (
                  <span className="text-[9px] text-muted-foreground">{dayTasks.length}</span>
                )}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    className="flex w-full items-center gap-1 truncate rounded bg-background/60 px-1.5 py-1 text-left text-[10px] transition-colors hover:bg-background"
                  >
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[t.priority])} />
                    <span className="truncate">{t.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="px-1 text-[9px] text-muted-foreground">+{dayTasks.length - 3} alte</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
