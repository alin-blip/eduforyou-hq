import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Save } from "lucide-react";
import { useGhlUsers, useUpdateGhlUser, useTeamProfiles, languageLabel, type GhlUser } from "@/hooks/useGhlUsers";

const NONE_VALUE = "__none__";

export default function GhlUsersPage() {
  const { data, isLoading } = useGhlUsers();
  const { data: profiles = [] } = useTeamProfiles();
  const update = useUpdateGhlUser();

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">GHL Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mapează user-ii GHL la nume reale, limbă și opțional la un user Supabase din echipă.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((u) => (
            <UserRow
              key={u.ghl_user_id}
              user={u}
              profiles={profiles}
              onSave={(patch) => update.mutate({ ghl_user_id: u.ghl_user_id, ...patch })}
              saving={update.isPending}
            />
          ))}
          {(data ?? []).length === 0 && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">Niciun user GHL detectat încă.</CardContent></Card>
          )}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  profiles,
  onSave,
  saving,
}: {
  user: GhlUser;
  profiles: { id: string; full_name: string | null; email: string | null }[];
  onSave: (patch: Partial<Pick<GhlUser, "display_name" | "language" | "is_active" | "profile_id">>) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(user.display_name);
  const [lang, setLang] = useState<GhlUser["language"]>(user.language);
  const [active, setActive] = useState(user.is_active);
  const [profileId, setProfileId] = useState<string>(user.profile_id ?? NONE_VALUE);
  const dirty =
    name !== user.display_name ||
    lang !== user.language ||
    active !== user.is_active ||
    (profileId === NONE_VALUE ? user.profile_id : profileId) !== user.profile_id;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-mono text-xs text-muted-foreground">{user.ghl_user_id}</CardTitle>
          <div className="flex items-center gap-1">
            <Badge variant={user.is_active ? "default" : "secondary"}>{user.is_active ? "Activ" : "Inactiv"}</Badge>
            <Badge variant="outline">{languageLabel(user.language)}</Badge>
            {user.profile && <Badge variant="secondary">🔗 {user.profile.full_name || user.profile.email}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 lg:grid-cols-[1fr_160px_220px_120px_auto] lg:items-end">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nume afișat</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Limbă</label>
          <Select value={lang} onValueChange={(v) => setLang(v as GhlUser["language"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ro">🇷🇴 Română</SelectItem>
              <SelectItem value="en">🇬🇧 Engleză</SelectItem>
              <SelectItem value="other">❓ Altul</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">User Supabase</label>
          <Select value={profileId} onValueChange={setProfileId}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>— Fără —</SelectItem>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.full_name || p.email || p.id}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} id={`active-${user.ghl_user_id}`} />
          <label htmlFor={`active-${user.ghl_user_id}`} className="text-sm">Activ</label>
        </div>
        <Button
          size="sm"
          disabled={!dirty || saving}
          onClick={() => onSave({
            display_name: name,
            language: lang,
            is_active: active,
            profile_id: profileId === NONE_VALUE ? null : profileId,
          })}
        >
          <Save className="mr-2 h-4 w-4" /> Salvează
        </Button>
      </CardContent>
    </Card>
  );
}
