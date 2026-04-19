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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  useDepartmentsList,
  useSetUserRoles,
  useUpdateProfile,
  type AppRole,
  type ProfileWithRoles,
} from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";

const ALL_ROLES: { value: AppRole; label: string }[] = [
  { value: "ceo", label: "CEO" },
  { value: "executive", label: "Executive" },
  { value: "manager", label: "Manager" },
  { value: "member", label: "Member" },
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  member: ProfileWithRoles | null;
}

export function MemberDialog({ open, onOpenChange, member }: Props) {
  const { isAdmin } = useAuth();
  const { data: departments = [] } = useDepartmentsList();
  const updateProfile = useUpdateProfile();
  const setRoles = useSetUserRoles();

  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("__none__");
  const [monthlyCost, setMonthlyCost] = useState<string>("");
  const [capacity, setCapacity] = useState<string>("40");
  const [roles, setRolesState] = useState<AppRole[]>([]);

  useEffect(() => {
    if (member) {
      setFullName(member.full_name ?? "");
      setJobTitle(member.job_title ?? "");
      setPhone(member.phone ?? "");
      setDepartmentId(member.department_id ?? "__none__");
      setMonthlyCost(member.monthly_cost ? String(member.monthly_cost) : "");
      setCapacity(member.weekly_capacity_hours ? String(member.weekly_capacity_hours) : "40");
      setRolesState(member.roles);
    }
  }, [member]);

  if (!member) return null;

  const toggleRole = (r: AppRole) => {
    setRolesState((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({
        id: member.id,
        patch: {
          full_name: fullName || null,
          job_title: jobTitle || null,
          phone: phone || null,
          department_id: departmentId === "__none__" ? null : departmentId,
          monthly_cost: monthlyCost ? Number(monthlyCost) : null,
          weekly_capacity_hours: capacity ? Number(capacity) : null,
        },
      });
      if (isAdmin) {
        await setRoles.mutateAsync({ userId: member.id, roles });
      }
      toast.success("Profil actualizat");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la salvare");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil membru</DialogTitle>
          <DialogDescription>{member.email}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nume complet</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Job title</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ex: Head of Growth" />
          </div>
          <div className="grid gap-2">
            <Label>Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Departament</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— fără —</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Cost lunar (€)</Label>
              <Input type="number" value={monthlyCost} onChange={(e) => setMonthlyCost(e.target.value)} placeholder="0" />
            </div>
            <div className="grid gap-2">
              <Label>Capacitate (h/săpt)</Label>
              <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
            </div>
          </div>

          {isAdmin && (
            <div className="grid gap-2 pt-2 border-t">
              <Label>Roluri</Label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_ROLES.map((r) => (
                  <label key={r.value} className="flex items-center gap-2 rounded-md border border-border p-2 cursor-pointer hover:bg-muted/50">
                    <Checkbox
                      checked={roles.includes(r.value)}
                      onCheckedChange={() => toggleRole(r.value)}
                    />
                    <span className="text-sm">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anulează</Button>
          <Button onClick={handleSave} disabled={updateProfile.isPending || setRoles.isPending}>
            Salvează
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
