import { useState } from "react";
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
import { toast } from "sonner";
import { useDepartmentsList, useInviteMember, type AppRole } from "@/hooks/useTeams";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function InviteMemberDialog({ open, onOpenChange }: Props) {
  const { data: departments = [] } = useDepartmentsList();
  const invite = useInviteMember();

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [role, setRole] = useState<AppRole>("member");
  const [departmentId, setDepartmentId] = useState<string>("__none__");

  const reset = () => {
    setEmail(""); setFullName(""); setJobTitle(""); setRole("member"); setDepartmentId("__none__");
  };

  const handleInvite = async () => {
    if (!email.trim() || !fullName.trim()) {
      toast.error("Email și nume obligatorii");
      return;
    }
    try {
      await invite.mutateAsync({
        email: email.trim().toLowerCase(),
        full_name: fullName.trim(),
        job_title: jobTitle || null,
        role,
        department_id: departmentId === "__none__" ? null : departmentId,
      });
      toast.success("Invitație trimisă pe email");
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la invitație");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invită membru</DialogTitle>
          <DialogDescription>Va primi un email cu link de acces.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nume@eduforyou.ro" />
          </div>
          <div className="grid gap-2">
            <Label>Nume complet</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Job title</Label>
            <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Ex: Sales Manager" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                  <SelectItem value="ceo">CEO</SelectItem>
                </SelectContent>
              </Select>
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anulează</Button>
          <Button onClick={handleInvite} disabled={invite.isPending}>
            {invite.isPending ? "Se trimite..." : "Trimite invitație"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
