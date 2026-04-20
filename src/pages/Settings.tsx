import { useEffect, useState } from "react";
import { Settings as SettingsIcon, User, Building2, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntity } from "@/hooks/useEntity";
import { useUpdateProfile } from "@/hooks/useTeams";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Profile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  job_title: string | null;
}

export default function SettingsPage() {
  const { user, roles, isAdmin } = useAuth();
  const { entities, current, setCurrent, refresh } = useEntity();
  const updateProfile = useUpdateProfile();

  const [profile, setProfile] = useState<Profile>({
    full_name: "", email: "", phone: "", avatar_url: "", job_title: "",
  });
  const [pwd, setPwd] = useState({ next: "", confirm: "" });
  const [locale, setLocale] = useState(() => localStorage.getItem("efy_locale") ?? "ro");
  const [tz, setTz] = useState(() => localStorage.getItem("efy_tz") ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [entityForm, setEntityForm] = useState({ name: "", slug: "", description: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,email,phone,avatar_url,job_title").eq("id", user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [user]);

  const initials = (profile.full_name || profile.email || "?")
    .split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      await updateProfile.mutateAsync({ id: user.id, patch: profile });
      toast.success("Profil salvat");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare la salvare");
    }
  };

  const handleChangePassword = async () => {
    if (pwd.next.length < 8) return toast.error("Minim 8 caractere");
    if (pwd.next !== pwd.confirm) return toast.error("Parolele nu se potrivesc");
    const { error } = await supabase.auth.updateUser({ password: pwd.next });
    if (error) return toast.error(error.message);
    toast.success("Parolă schimbată");
    setPwd({ next: "", confirm: "" });
  };

  const handleSavePrefs = () => {
    localStorage.setItem("efy_locale", locale);
    localStorage.setItem("efy_tz", tz);
    toast.success("Preferințe salvate");
  };

  const handleCreateEntity = async () => {
    if (!entityForm.name || !entityForm.slug) return toast.error("Nume și slug obligatorii");
    const { error } = await supabase.from("entities").insert({
      name: entityForm.name,
      slug: entityForm.slug.toLowerCase().replace(/\s+/g, "-"),
      description: entityForm.description || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Entitate creată");
    setEntityForm({ name: "", slug: "", description: "" });
    await refresh();
  };

  const handleDeleteEntity = async (id: string) => {
    if (!confirm("Sigur ștergi această entitate? Datele asociate rămân dar fără referință.")) return;
    const { error } = await supabase.from("entities").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Entitate ștearsă");
    await refresh();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Profil, securitate, preferințe și organizație.</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile"><User className="h-4 w-4 mr-2" />Profil</TabsTrigger>
          <TabsTrigger value="security"><Lock className="h-4 w-4 mr-2" />Securitate</TabsTrigger>
          <TabsTrigger value="preferences"><Globe className="h-4 w-4 mr-2" />Preferințe</TabsTrigger>
          {isAdmin && <TabsTrigger value="organization"><Building2 className="h-4 w-4 mr-2" />Organizație</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profil utilizator</CardTitle>
              <CardDescription>Informațiile tale personale, vizibile altor membri.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  {profile.avatar_url && <AvatarImage src={profile.avatar_url} />}
                  <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Label>URL avatar</Label>
                  <Input
                    value={profile.avatar_url ?? ""}
                    onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nume complet</Label>
                  <Input value={profile.full_name ?? ""} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={profile.email ?? ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Telefon</Label>
                  <Input value={profile.phone ?? ""} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Funcție</Label>
                  <Input value={profile.job_title ?? ""} onChange={(e) => setProfile({ ...profile, job_title: e.target.value })} />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {roles.map((r) => <Badge key={r} variant="outline" className="capitalize">{r}</Badge>)}
                </div>
                <Button onClick={handleSaveProfile} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Se salvează..." : "Salvează profil"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Schimbă parola</CardTitle>
              <CardDescription>Minim 8 caractere. Vei rămâne logat după schimbare.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Parolă nouă</Label>
                <Input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Confirmă parolă</Label>
                <Input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} />
              </div>
              <Button onClick={handleChangePassword}>Actualizează parolă</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferințe aplicație</CardTitle>
              <CardDescription>Limba și fusul orar pentru afișări.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Limbă</Label>
                <Select value={locale} onValueChange={setLocale}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ro">Română</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Fus orar</Label>
                <Input value={tz} onChange={(e) => setTz(e.target.value)} placeholder="Europe/Bucharest" />
                <p className="text-xs text-muted-foreground">Detectat automat: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
              </div>
              <Button onClick={handleSavePrefs}>Salvează preferințe</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="organization">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Entități existente</CardTitle>
                  <CardDescription>Companii sau brand-uri sub umbrela ta.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {entities.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{e.name}</p>
                          {e.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                          {current?.id === e.id && <Badge className="text-xs">Activă</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{e.slug} · {e.description ?? "—"}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {current?.id !== e.id && (
                          <Button size="sm" variant="outline" onClick={() => setCurrent(e)}>Activează</Button>
                        )}
                        {!e.is_default && (
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteEntity(e.id)}>
                            Șterge
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Entitate nouă</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label>Nume</Label>
                    <Input value={entityForm.name} onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={entityForm.slug} onChange={(e) => setEntityForm({ ...entityForm, slug: e.target.value })} placeholder="brand-nou" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descriere</Label>
                    <Input value={entityForm.description} onChange={(e) => setEntityForm({ ...entityForm, description: e.target.value })} />
                  </div>
                  <Button onClick={handleCreateEntity}>Creează entitate</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
