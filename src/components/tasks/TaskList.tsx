import { format, isPast, isToday } from "date-fns";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TaskPriority, TaskStatus, TaskWithRelations } from "@/hooks/useTasks";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "text-muted-foreground",
  medium: "text-primary",
  high: "text-warning",
  urgent: "text-destructive",
};

const STATUS_VARIANT: Record<TaskStatus, string> = {
  todo: "bg-muted/40 text-muted-foreground",
  in_progress: "bg-primary/15 text-primary",
  blocked: "bg-destructive/15 text-destructive",
  done: "bg-success/15 text-success",
};

interface Props {
  tasks: TaskWithRelations[];
  onTaskClick: (t: TaskWithRelations) => void;
}

export function TaskList({ tasks, onTaskClick }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="glass-card rounded-xl p-12 text-center text-sm text-muted-foreground">
        Niciun task încă. Apasă "+ Task nou" pentru a începe.
      </div>
    );
  }
  return (
    <div className="glass-card overflow-hidden rounded-xl">
      <Table>
        <TableHeader>
          <TableRow className="border-border/40">
            <TableHead>Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Prioritate</TableHead>
            <TableHead>KR</TableHead>
            <TableHead>Departament</TableHead>
            <TableHead>Responsabil</TableHead>
            <TableHead>Deadline</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => {
            const due = t.due_date ? new Date(t.due_date) : null;
            const overdue = due && isPast(due) && t.status !== "done" && !isToday(due);
            const initials =
              t.assignee?.full_name
                ?.split(" ")
                .map((s) => s[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() ?? "?";

            return (
              <TableRow
                key={t.id}
                className="cursor-pointer border-border/40 hover:bg-card/40"
                onClick={() => onTaskClick(t)}
              >
                <TableCell className="max-w-md font-medium">{t.title}</TableCell>
                <TableCell>
                  <Badge className={cn("border-0 capitalize", STATUS_VARIANT[t.status])}>
                    {t.status.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center gap-1 capitalize", PRIORITY_STYLES[t.priority])}>
                    <Flag className="h-3 w-3" />
                    {t.priority}
                  </span>
                </TableCell>
                <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">
                  {t.key_result?.title ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {t.department?.name ?? "—"}
                </TableCell>
                <TableCell>
                  {t.assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={t.assignee.avatar_url ?? undefined} />
                        <AvatarFallback className="text-[9px]">{initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{t.assignee.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className={cn("text-xs", overdue && "text-destructive")}>
                  {due ? format(due, "d MMM yyyy") : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
