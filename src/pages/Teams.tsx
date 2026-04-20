import { useMemo, useState } from "react";
import { Plus, Users, UserPlus, Building2, Crown, Shield, User as UserIcon, Pencil, Trash2, Mail, Send, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  useTeamMembers,
  useDepartmentsList,
  useDeleteDepartment,
  useTeamAuthStatus,
  type AppRole,
  type AuthStatusRow,
  type Department,
  type ProfileWithRoles,
} from "@/hooks/useTeams";
import { useAuth } from "@/hooks/useAuth";
import { MemberDialog } from "@/components/teams/MemberDialog";
import { DepartmentDialog } from "@/components/teams/DepartmentDialog";
import { InviteMemberDialog } from "@/components/teams/InviteMemberDialog";
import { WorkloadView } from "@/components/teams/WorkloadView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ROLE_META: Record<AppRole, { label: string; icon: typeof Crown; variant: "default" | "secondary" | "outline" }> = {
  ceo: { label: "CEO", icon: Crown, variant: "default" },
  executive: { label: "Executive", icon: Shield, variant: "default" },
  manager: { label: "Manager", icon: Shield, variant: "secondary" },
  member: { label: "Member", icon: UserIcon, variant: "outline" },
};

function getInitials(name: string | null, email: string | null) {
  const src = name || email || "?";
  return src
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
}

function topRole(roles: AppRole[]): AppRole {
  const order: AppRole[] = ["ceo", "executive", "manager", "member"];
  for (const r of order) if (roles.includes(r)) return r;
  return "member";
}

export default function TeamsPage() {
  const { isAdmin } = useAuth();
  const { data: members = [], isLoading } = useTeamMembers();
  const { data: departments = [] } = useDepartmentsList();
  const { data: authStatus } = useTeamAuthStatus();
  const deleteDept = useDeleteDepartment();

  const [memberDialog, setMemberDialog] = useState<ProfileWithRoles | null>(null);
  const [deptDialog, setDeptDialog] = useState<Department | null>(null);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const [pendingOnly, setPendingOnly] = useState(false);

  const isPending = (userId: string) => {
    const s = authStatus?.get(userId);
    if (!s) return true;
    return !s.last_sign_in_at && !s.email_confirmed_at;
  };

  const handleResendOne = async (email: string) => {
    setResendingEmail(email);
    try {
      const { data, error } = await supabase.functions.invoke("resend-invites", {
        body: { emails: [email] },
      });
      if (error) throw error;
      const r = (data?.results ?? [])[0];
      if (r?.ok) toast.success(`Trimis către ${email}`);
      else toast.error(r?.error || "Eșuat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare");
    } finally {
      setResendingEmail(null);
    }
  };

  const handleResendAll = async () => {
    const pending = members
      .filter((m) => m.email)
      .map((m) => m.email as string);
    if (pending.length === 0) {
      toast.error("Niciun email găsit");
      return;
    }
    setResending(true);
    try {
      const { data, error } = await supabase.functions.invoke("resend-invites", {
        body: { emails: pending },
      });
      if (error) throw error;
      const ok = (data?.results ?? []).filter((r: any) => r.ok).length;
      const failed = (data?.results ?? []).filter((r: any) => !r.ok);
      toast.success(`Trimise ${ok}/${pending.length} către ${data?.redirectTo}`);
      if (failed.length) {
        console.warn("Failed:", failed);
        toast.warning(`${failed.length} eșuate — vezi consola`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare");
    } finally {
      setResending(false);
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, ProfileWithRoles[]>();
    const filtered = pendingOnly ? members.filter((m) => isPending(m.id)) : members;
    filtered.forEach((m) => {
      const key = m.department_id ?? "__unassigned__";
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    });
    return map;
  }, [members, pendingOnly, authStatus]);

  const pendingCount = useMemo(
    () => members.filter((m) => isPending(m.id)).length,
    [members, authStatus]
  );

  const totalCost = members.reduce((sum, m) => sum + (Number(m.monthly_cost) || 0), 0);
  const totalCapacity = members.reduce((sum, m) => sum + (m.weekly_capacity_hours ?? 0), 0);

  const handleDeleteDept = async (id: string) => {
    try {
      await deleteDept.mutateAsync(id);
      toast.success("Departament șters");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams & Workload</h1>
          <p className="text-muted-foreground mt-1">
            Organigramă, capacitate și roluri pentru întreaga companie.
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setDeptDialog(null); setDeptDialogOpen(true); }}>
              <Building2 className="h-4 w-4 mr-2" /> Departament nou
            </Button>
            <Button variant="outline" onClick={handleResendAll} disabled={resending}>
              <Mail className="h-4 w-4 mr-2" /> {resending ? "Se trimit..." : "Retrimite invitații"}
            </Button>
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" /> Invită membru
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Membri</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{members.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Departamente</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{departments.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cost lunar total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">€{totalCost.toLocaleString("ro-RO")}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Capacitate săpt.</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalCapacity}h</p></CardContent>
        </Card>
      </div>

      {/* Tabs: Organigramă · Workload */}
      <Tabs defaultValue="org" className="space-y-4">
        <TabsList>
          <TabsTrigger value="org">Organigramă</TabsTrigger>
          <TabsTrigger value="workload">Workload</TabsTrigger>
        </TabsList>

        <TabsContent value="workload">
          <WorkloadView members={members} />
        </TabsContent>

        <TabsContent value="org">
      {isLoading ? (
        <p className="text-muted-foreground">Se încarcă echipele...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {departments.map((d) => {
            const deptMembers = grouped.get(d.id) ?? [];
            const cost = deptMembers.reduce((s, m) => s + (Number(m.monthly_cost) || 0), 0);
            return (
              <Card key={d.id} className="border-l-4" style={{ borderLeftColor: `hsl(var(--${d.color || "primary"}))` }}>
                <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {d.name}
                      <Badge variant="outline" className="ml-1">{deptMembers.length}</Badge>
                    </CardTitle>
                    {d.description && <p className="text-sm text-muted-foreground">{d.description}</p>}
                    <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                      {d.budget_monthly != null && <span>Buget: €{Number(d.budget_monthly).toLocaleString("ro-RO")}</span>}
                      <span>Cost: €{cost.toLocaleString("ro-RO")}</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { setDeptDialog(d); setDeptDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ștergi departamentul?</AlertDialogTitle>
                            <AlertDialogDescription>Membrii rămân, doar legătura se rupe.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Anulează</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteDept(d.id)}>Șterge</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {deptMembers.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">Niciun membru în acest departament.</p>
                  ) : (
                    <div className="space-y-2">
                      {deptMembers.map((m) => <MemberRow key={m.id} member={m} status={authStatus?.get(m.id)} onClick={() => setMemberDialog(m)} />)}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Unassigned */}
          {(grouped.get("__unassigned__") ?? []).length > 0 && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-5 w-5" /> Fără departament
                  <Badge variant="outline">{grouped.get("__unassigned__")!.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {grouped.get("__unassigned__")!.map((m) => (
                  <MemberRow key={m.id} member={m} status={authStatus?.get(m.id)} onClick={() => setMemberDialog(m)} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
        </TabsContent>
      </Tabs>

      <MemberDialog
        open={!!memberDialog}
        onOpenChange={(o) => !o && setMemberDialog(null)}
        member={memberDialog}
      />
      <DepartmentDialog
        open={deptDialogOpen}
        onOpenChange={setDeptDialogOpen}
        department={deptDialog}
      />
      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </div>
  );
}

function MemberRow({ member, status, onClick }: { member: ProfileWithRoles; status?: AuthStatusRow; onClick: () => void }) {
  const role = topRole(member.roles);
  const meta = ROLE_META[role];
  const Icon = meta.icon;

  // Derive auth status
  let statusLabel = "Necunoscut";
  let statusVariant: "default" | "secondary" | "outline" | "destructive" = "outline";
  let statusTitle = "Status auth indisponibil";
  if (status) {
    if (status.last_sign_in_at) {
      statusLabel = "Activ";
      statusVariant = "default";
      statusTitle = `Ultima logare: ${new Date(status.last_sign_in_at).toLocaleString("ro-RO")}`;
    } else if (status.email_confirmed_at) {
      statusLabel = "Confirmat";
      statusVariant = "secondary";
      statusTitle = `Email confirmat: ${new Date(status.email_confirmed_at).toLocaleString("ro-RO")} — încă nu s-a logat`;
    } else {
      statusLabel = "În așteptare";
      statusVariant = "outline";
      statusTitle = status.invited_at
        ? `Invitat: ${new Date(status.invited_at).toLocaleString("ro-RO")} — email neconfirmat`
        : "Email neconfirmat";
    }
  }

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-left hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-9 w-9">
          {member.avatar_url && <AvatarImage src={member.avatar_url} />}
          <AvatarFallback>{getInitials(member.full_name, member.email)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{member.full_name ?? member.email}</p>
          <p className="text-xs text-muted-foreground truncate">{member.job_title ?? member.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {member.monthly_cost != null && (
          <span className="text-xs text-muted-foreground hidden sm:inline">€{Number(member.monthly_cost).toLocaleString("ro-RO")}</span>
        )}
        <Badge variant={statusVariant} className="hidden md:inline-flex" title={statusTitle}>
          {statusLabel}
        </Badge>
        <Badge variant={meta.variant} className="gap-1">
          <Icon className="h-3 w-3" /> {meta.label}
        </Badge>
      </div>
    </button>
  );
}
