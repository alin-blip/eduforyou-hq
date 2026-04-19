import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

import {
  useDeleteKeyResult,
  useDeleteObjective,
  type KeyResult,
  type Objective,
} from "@/hooks/useOkr";
import { ObjectiveDialog } from "./ObjectiveDialog";
import { KeyResultDialog } from "./KeyResultDialog";

const statusStyles: Record<string, string> = {
  on_track: "bg-accent/15 text-accent border-accent/30",
  at_risk: "bg-warning/15 text-warning border-warning/30",
  off_track: "bg-destructive/15 text-destructive border-destructive/30",
  completed: "bg-primary/15 text-primary border-primary/30",
  archived: "bg-muted text-muted-foreground border-border",
};

const statusLabel: Record<string, string> = {
  on_track: "On track",
  at_risk: "At risk",
  off_track: "Off track",
  completed: "Completed",
  archived: "Archived",
};

const levelStyle: Record<string, string> = {
  company: "bg-gradient-primary text-primary-foreground",
  department: "bg-accent/20 text-accent",
  individual: "bg-muted text-muted-foreground",
};

const krStatusStyle: Record<string, string> = {
  not_started: "text-muted-foreground bg-muted",
  in_progress: "text-primary bg-primary/15",
  completed: "text-accent bg-accent/15",
  blocked: "text-destructive bg-destructive/15",
};

function krProgress(kr: KeyResult): number {
  const start = Number(kr.start_value ?? 0);
  const target = Number(kr.target_value ?? 0);
  const current = Number(kr.current_value ?? 0);
  if (target === start) return current >= target ? 100 : 0;
  const pct = ((current - start) / (target - start)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

interface Props {
  objective: Objective;
  index: number;
}

export function ObjectiveCard({ objective, index }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [krOpen, setKrOpen] = useState(false);
  const [editingKr, setEditingKr] = useState<KeyResult | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDeleteKr, setConfirmDeleteKr] = useState<KeyResult | null>(null);

  const deleteObjective = useDeleteObjective();
  const deleteKr = useDeleteKeyResult();

  const handleDelete = async () => {
    try {
      await deleteObjective.mutateAsync(objective.id);
      toast({ title: "Obiectiv șters" });
    } catch (err) {
      toast({
        title: "Eroare",
        description: err instanceof Error ? err.message : "Nu s-a putut șterge",
        variant: "destructive",
      });
    } finally {
      setConfirmDelete(false);
    }
  };

  const handleDeleteKr = async () => {
    if (!confirmDeleteKr) return;
    try {
      await deleteKr.mutateAsync(confirmDeleteKr.id);
      toast({ title: "Key Result șters" });
    } catch (err) {
      toast({
        title: "Eroare",
        description: err instanceof Error ? err.message : "Nu s-a putut șterge",
        variant: "destructive",
      });
    } finally {
      setConfirmDeleteKr(null);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
        className="glass-card overflow-hidden rounded-xl"
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="mt-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>

            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                    levelStyle[objective.level],
                  )}
                >
                  {objective.level}
                </span>
                <Badge variant="outline" className={cn("font-mono text-[10px]", statusStyles[objective.status])}>
                  {statusLabel[objective.status]}
                </Badge>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {objective.quarter}
                </span>
              </div>

              <h3 className="font-display text-lg font-semibold leading-tight">
                {objective.title}
              </h3>
              {objective.description && (
                <p className="text-sm text-muted-foreground">{objective.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {objective.department && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {objective.department.name}
                  </span>
                )}
                {objective.owner && (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3 w-3" /> {objective.owner.full_name ?? "—"}
                  </span>
                )}
                {objective.due_date && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(objective.due_date).toLocaleDateString("ro-RO")}
                  </span>
                )}
                <span className="ml-auto font-mono text-foreground">
                  {objective.key_results.length} KR
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progres</span>
                  <span className="font-mono font-semibold">{objective.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${objective.progress}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-border/50 bg-card/30 px-5 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Key Results
              </h4>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingKr(null);
                  setKrOpen(true);
                }}
              >
                <Plus className="h-3 w-3" /> Adaugă KR
              </Button>
            </div>

            {objective.key_results.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border bg-card/20 py-6 text-center text-xs text-muted-foreground">
                Niciun Key Result definit. Adaugă primul ca să măsori progresul.
              </p>
            ) : (
              <ul className="space-y-2">
                {objective.key_results.map((kr) => {
                  const pct = krProgress(kr);
                  return (
                    <li
                      key={kr.id}
                      className="rounded-lg border border-border/40 bg-card/40 p-3"
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium">{kr.title}</span>
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider",
                                krStatusStyle[kr.status],
                              )}
                            >
                              {kr.status.replace("_", " ")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">
                              {Number(kr.current_value).toLocaleString("ro-RO")} /{" "}
                              {Number(kr.target_value).toLocaleString("ro-RO")} {kr.metric_unit ?? ""}
                            </span>
                            {kr.due_date && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(kr.due_date).toLocaleDateString("ro-RO")}
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6 }}
                              className={cn(
                                "h-full rounded-full",
                                pct >= 80
                                  ? "bg-accent"
                                  : pct >= 50
                                    ? "bg-primary"
                                    : pct >= 25
                                      ? "bg-warning"
                                      : "bg-destructive",
                              )}
                            />
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingKr(kr);
                              setKrOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setConfirmDeleteKr(kr)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </motion.div>

      <ObjectiveDialog open={editOpen} onOpenChange={setEditOpen} objective={objective} />
      <KeyResultDialog
        open={krOpen}
        onOpenChange={setKrOpen}
        objectiveId={objective.id}
        keyResult={editingKr}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi obiectivul?</AlertDialogTitle>
            <AlertDialogDescription>
              Acțiunea șterge și toate Key Results asociate. Nu se poate recupera.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!confirmDeleteKr} onOpenChange={(o) => !o && setConfirmDeleteKr(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ștergi Key Result-ul?</AlertDialogTitle>
            <AlertDialogDescription>Acțiunea nu se poate recupera.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteKr}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
