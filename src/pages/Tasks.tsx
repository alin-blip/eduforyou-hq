import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckSquare, Plus, KanbanSquare, List, Calendar as CalendarIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  useTasks,
  useKeyResultsList,
  type TaskFilters,
  type TaskPriority,
  type TaskStatus,
  type TaskWithRelations,
} from "@/hooks/useTasks";
import { useDepartments, useProfiles } from "@/hooks/useOkr";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskCalendar } from "@/components/tasks/TaskCalendar";
import { TaskDialog } from "@/components/tasks/TaskDialog";

export default function TasksPage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState<TaskFilters>({});
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TaskWithRelations | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("todo");

  const merged: TaskFilters = useMemo(
    () => ({ ...filters, search: search.trim() || undefined }),
    [filters, search],
  );

  const { data: tasks = [], isLoading } = useTasks(merged);
  const { data: departments = [] } = useDepartments();
  const { data: profiles = [] } = useProfiles();
  const { data: krs = [] } = useKeyResultsList();

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.status === "done").length;
    const blocked = tasks.filter((t) => t.status === "blocked").length;
    const overdue = tasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date) < new Date(new Date().toDateString()) &&
        t.status !== "done",
    ).length;
    return { total, done, blocked, overdue };
  }, [tasks]);

  const openNew = (status: TaskStatus = "todo") => {
    setEditing(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  };
  const openEdit = (t: TaskWithRelations) => {
    setEditing(t);
    setDialogOpen(true);
  };

  // Realtime: live updates on task changes (kanban moves, edits, deletes)
  useEffect(() => {
    const channel = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks" },
        () => {
          qc.invalidateQueries({ queryKey: ["tasks"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
      >
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Execution layer
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            De la strategie la execuție — fiecare task legat de un KR sau departament.
          </p>
        </div>
        <Button onClick={() => openNew("todo")} className="bg-gradient-primary shadow-elegant">
          <Plus className="mr-1.5 h-4 w-4" /> Task nou
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Finalizate", value: stats.done, color: "text-success" },
          { label: "Blocate", value: stats.blocked, color: "text-destructive" },
          { label: "Întârziate", value: stats.overdue, color: "text-warning" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {s.label}
            </p>
            <p className={`mt-1 font-display text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card flex flex-wrap items-center gap-2 rounded-xl p-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Caută titlu…"
            className="h-9 pl-8 text-sm"
          />
        </div>
        <Select
          value={filters.departmentId ?? "all"}
          onValueChange={(v) =>
            setFilters({ ...filters, departmentId: v === "all" ? null : v })
          }
        >
          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Departament" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate departamentele</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.assigneeId ?? "all"}
          onValueChange={(v) =>
            setFilters({ ...filters, assigneeId: v === "all" ? null : v })
          }
        >
          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder="Owner" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toți responsabilii</SelectItem>
            {profiles.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.full_name ?? p.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.keyResultId ?? "all"}
          onValueChange={(v) =>
            setFilters({ ...filters, keyResultId: v === "all" ? null : v })
          }
        >
          <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="Key Result" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate KR</SelectItem>
            {krs.map((k) => (
              <SelectItem key={k.id} value={k.id}>{k.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.priority ?? "all"}
          onValueChange={(v) =>
            setFilters({ ...filters, priority: v === "all" ? null : (v as TaskPriority) })
          }
        >
          <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Prioritate" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate prioritățile</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        {(filters.departmentId || filters.assigneeId || filters.keyResultId || filters.priority || search) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters({});
              setSearch("");
            }}
          >
            Reset
          </Button>
        )}
      </div>

      <Tabs defaultValue="kanban">
        <TabsList>
          <TabsTrigger value="kanban">
            <KanbanSquare className="mr-1.5 h-3.5 w-3.5" /> Kanban
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="mr-1.5 h-3.5 w-3.5" /> Listă
          </TabsTrigger>
          <TabsTrigger value="calendar">
            <CalendarIcon className="mr-1.5 h-3.5 w-3.5" /> Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Se încarcă…</p>
          ) : (
            <TaskKanban tasks={tasks} onTaskClick={openEdit} onAdd={openNew} />
          )}
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Se încarcă…</p>
          ) : (
            <TaskList tasks={tasks} onTaskClick={openEdit} />
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Se încarcă…</p>
          ) : (
            <TaskCalendar tasks={tasks} onTaskClick={openEdit} />
          )}
        </TabsContent>
      </Tabs>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editing}
        defaultStatus={defaultStatus}
      />
    </div>
  );
}
