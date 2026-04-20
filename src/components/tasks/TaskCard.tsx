import { format, isPast, isToday } from "date-fns";
import { Calendar, Flag, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { TaskWithRelations, TaskPriority } from "@/hooks/useTasks";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "text-muted-foreground",
  medium: "text-primary",
  high: "text-warning",
  urgent: "text-destructive",
};

interface Props {
  task: TaskWithRelations;
  onClick?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export function TaskCard({ task, onClick, draggable, onDragStart }: Props) {
  const due = task.due_date ? new Date(task.due_date) : null;
  const overdue = due && isPast(due) && task.status !== "done" && !isToday(due);

  const initials =
    task.assignee?.full_name
      ?.split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <button
      type="button"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      className="glass-card group w-full cursor-pointer rounded-lg border border-border/50 bg-card/60 p-3 text-left transition-all hover:border-primary/40 hover:shadow-elegant"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {task.title}
        </p>
        <Flag className={cn("h-3.5 w-3.5 shrink-0", PRIORITY_STYLES[task.priority])} />
      </div>

      {task.key_result && (
        <div className="mb-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Target className="h-3 w-3" />
          <span className="line-clamp-1">{task.key_result.title}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.department && (
            <span className="rounded-full border border-border/40 bg-card/40 px-2 py-0.5 text-[10px] text-muted-foreground">
              {task.department.name}
            </span>
          )}
          {due && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px]",
                overdue ? "text-destructive" : "text-muted-foreground",
              )}
            >
              <Calendar className="h-3 w-3" />
              {format(due, "d MMM")}
            </span>
          )}
        </div>
        {task.assignee && (
          <Avatar className="h-5 w-5">
            <AvatarImage src={task.assignee.avatar_url ?? undefined} />
            <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
          </Avatar>
        )}
      </div>
    </button>
  );
}
