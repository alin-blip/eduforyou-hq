import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useTeamMembers, useCreateDepartment, useUpdateDepartment, type Department } from "@/hooks/useTeams";

const COLORS = ["primary", "accent", "success", "warning", "destructive"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  department: Department | null;
}

export function DepartmentDialog({ open, onOpenChange, department }: Props) {
  const { data: members = [] } = useTeamMembers();
  const create = useCreateDepartment();
  const update = useUpdateDepartment();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("primary");
  const [managerId, setManagerId] = useState<string>("__none__");
  const [budget, setBudget] = useState<string>("");

  useEffect(() => {
    if (department) {
      setName(department.name);
      setSlug(department.slug);
      setDescription(department.description ?? "");
      setColor(department.color ?? "primary");
      setManagerId(department.manager_id ?? "__none__");
      setBudget(department.budget_monthly ? String(department.budget_monthly) : "");
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setColor("primary");
      setManagerId("__none__");
      setBudget("");
    }
  }, [department, open]);

  const handleSave = async () => {
    if (!name.trim() || !slug.trim()) {
      toast.error("Nume și slug obligatorii");
      return;
    }
    const payload = {
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/\s+/g, "-"),
      description: description || null,
      color,
      manager_id: managerId === "__none__" ? null : managerId,
      budget_monthly: budget ? Number(budget) : null,
    };
    try {
      if (department) {
        await update.mutateAsync({ id: department.id, patch: payload });
        toast.success("Departament actualizat");
      } else {
        await create.mutateAsync(payload);
        toast.success("Departament creat");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{department ? "Editează departament" : "Departament nou"}</DialogTitle>
          <DialogDescription>Configurează echipa, managerul și bugetul.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Nume</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Marketing" />
            </div>
            <div className="grid gap-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="marketing" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Descriere</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Manager</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— fără —</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.full_name ?? m.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Buget lunar (€)</Label>
              <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Culoare temă</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 bg-${c} ${
                    color === c ? "border-foreground scale-110" : "border-border"
                  } transition-transform`}
                  style={{ backgroundColor: `hsl(var(--${c}))` }}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anulează</Button>
          <Button onClick={handleSave} disabled={create.isPending || update.isPending}>Salvează</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
