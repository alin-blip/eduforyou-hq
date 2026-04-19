import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  currentQuarter,
  useCreateObjective,
  useDepartments,
  useProfiles,
  useUpdateObjective,
  type Objective,
} from "@/hooks/useOkr";

const schema = z.object({
  title: z.string().min(3, "Minim 3 caractere").max(160),
  description: z.string().max(500).optional().or(z.literal("")),
  level: z.enum(["company", "department", "individual"]),
  status: z.enum(["on_track", "at_risk", "off_track", "completed", "archived"]),
  quarter: z.string().min(6),
  department_id: z.string().optional(),
  owner_id: z.string().optional(),
  due_date: z.string().optional().or(z.literal("")),
  progress: z.coerce.number().min(0).max(100),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective?: Objective | null;
}

export function ObjectiveDialog({ open, onOpenChange, objective }: Props) {
  const { user } = useAuth();
  const isEdit = !!objective;
  const create = useCreateObjective();
  const update = useUpdateObjective();
  const { data: departments } = useDepartments();
  const { data: profiles } = useProfiles();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      level: "company",
      status: "on_track",
      quarter: currentQuarter(),
      department_id: undefined,
      owner_id: undefined,
      due_date: "",
      progress: 0,
    },
  });

  useEffect(() => {
    if (objective) {
      form.reset({
        title: objective.title,
        description: objective.description ?? "",
        level: objective.level,
        status: objective.status,
        quarter: objective.quarter,
        department_id: objective.department_id ?? undefined,
        owner_id: objective.owner_id ?? undefined,
        due_date: objective.due_date ?? "",
        progress: objective.progress,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        level: "company",
        status: "on_track",
        quarter: currentQuarter(),
        department_id: undefined,
        owner_id: undefined,
        due_date: "",
        progress: 0,
      });
    }
  }, [objective, open, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      const payload = {
        title: values.title,
        description: values.description || null,
        level: values.level,
        status: values.status,
        quarter: values.quarter,
        department_id: values.department_id || null,
        owner_id: values.owner_id || null,
        due_date: values.due_date || null,
        progress: values.progress,
      };

      if (isEdit && objective) {
        await update.mutateAsync({ id: objective.id, patch: payload });
        toast({ title: "Obiectiv actualizat" });
      } else {
        await create.mutateAsync({ ...payload, created_by: user?.id });
        toast({ title: "Obiectiv creat" });
      }
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ceva nu a mers";
      toast({ title: "Eroare", description: msg, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Editează obiectivul" : "Obiectiv nou"}
          </DialogTitle>
          <DialogDescription>
            Definește un obiectiv clar pentru companie, departament sau individual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Titlu</Label>
            <Input {...form.register("title")} placeholder="Ex: Atinge €1M ARR până la final de an" />
            {form.formState.errors.title && (
              <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descriere</Label>
            <Textarea
              {...form.register("description")}
              placeholder="Context, motivație, impact așteptat…"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Nivel</Label>
              <Select
                value={form.watch("level")}
                onValueChange={(v) => form.setValue("level", v as FormValues["level"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company">Companie</SelectItem>
                  <SelectItem value="department">Departament</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as FormValues["status"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_track">On track</SelectItem>
                  <SelectItem value="at_risk">At risk</SelectItem>
                  <SelectItem value="off_track">Off track</SelectItem>
                  <SelectItem value="completed">Completat</SelectItem>
                  <SelectItem value="archived">Arhivat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Trimestru</Label>
              <Input {...form.register("quarter")} placeholder="2026-Q2" />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" {...form.register("due_date")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Departament</Label>
              <Select
                value={form.watch("department_id") ?? "none"}
                onValueChange={(v) => form.setValue("department_id", v === "none" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Niciunul" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Niciunul</SelectItem>
                  {departments?.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select
                value={form.watch("owner_id") ?? "none"}
                onValueChange={(v) => form.setValue("owner_id", v === "none" ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nimeni" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nimeni</SelectItem>
                  {profiles?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name ?? p.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Progres ({form.watch("progress")}%)</Label>
            <Input type="range" min={0} max={100} {...form.register("progress")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="bg-gradient-primary text-primary-foreground hover:opacity-90"
            >
              {isEdit ? "Salvează" : "Creează"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
