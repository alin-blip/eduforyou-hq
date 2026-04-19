import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  useCreateKeyResult,
  useProfiles,
  type KeyResult,
  useUpdateKeyResult,
} from "@/hooks/useOkr";

const schema = z.object({
  title: z.string().min(2).max(160),
  metric_unit: z.string().max(20).optional().or(z.literal("")),
  start_value: z.coerce.number(),
  target_value: z.coerce.number(),
  current_value: z.coerce.number(),
  status: z.enum(["not_started", "in_progress", "completed", "blocked"]),
  owner_id: z.string().optional(),
  due_date: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  objectiveId: string;
  keyResult?: KeyResult | null;
}

export function KeyResultDialog({ open, onOpenChange, objectiveId, keyResult }: Props) {
  const isEdit = !!keyResult;
  const create = useCreateKeyResult();
  const update = useUpdateKeyResult();
  const { data: profiles } = useProfiles();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      title: keyResult?.title ?? "",
      metric_unit: keyResult?.metric_unit ?? "",
      start_value: Number(keyResult?.start_value ?? 0),
      target_value: Number(keyResult?.target_value ?? 100),
      current_value: Number(keyResult?.current_value ?? 0),
      status: keyResult?.status ?? "not_started",
      owner_id: keyResult?.owner_id ?? undefined,
      due_date: keyResult?.due_date ?? "",
    },
  });

  const onSubmit = async (v: FormValues) => {
    try {
      const payload = {
        objective_id: objectiveId,
        title: v.title,
        metric_unit: v.metric_unit || null,
        start_value: v.start_value,
        target_value: v.target_value,
        current_value: v.current_value,
        status: v.status,
        owner_id: v.owner_id || null,
        due_date: v.due_date || null,
      };
      if (isEdit && keyResult) {
        await update.mutateAsync({ id: keyResult.id, patch: payload });
        toast({ title: "Key Result actualizat" });
      } else {
        await create.mutateAsync(payload);
        toast({ title: "Key Result creat" });
      }
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare";
      toast({ title: "Eroare", description: msg, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEdit ? "Editează Key Result" : "Key Result nou"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Titlu</Label>
            <Input {...form.register("title")} placeholder="Ex: Crește MRR la €100k" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Start</Label>
              <Input type="number" step="0.01" {...form.register("start_value")} />
            </div>
            <div className="space-y-2">
              <Label>Actual</Label>
              <Input type="number" step="0.01" {...form.register("current_value")} />
            </div>
            <div className="space-y-2">
              <Label>Target</Label>
              <Input type="number" step="0.01" {...form.register("target_value")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Unitate</Label>
              <Input {...form.register("metric_unit")} placeholder="EUR, %, leads" />
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
                  <SelectItem value="not_started">Not started</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" {...form.register("due_date")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button
              type="submit"
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
