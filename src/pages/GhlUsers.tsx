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
import { useGhlUsers, useUpdateGhlUser, languageLabel, type GhlUser } from "@/hooks/useGhlUsers";

export default function GhlUsersPage() {
  const { data, isLoading } = useGhlUsers();
  const update = useUpdateGhlUser();

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">GHL Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mapează ID-urile userilor GHL la nume reale și limbă (RO/EN). Userii noi sunt detectați automat la sync.
        </p>
      </header>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((u) => (
            <UserRow key={u.ghl_user_id} user={u} onSave={(patch) => update.mutate({ ghl_user_id: u.ghl_user_id, ...patch })} saving={update.isPending} />
          ))}
          {(data ?? []).length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Niciun user GHL detectat încă. Rulează un sync din /integrations.
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  onSave,
  saving,
}: {
  user: GhlUser;
  onSave: (patch: Partial<Pick<GhlUser, "display_name" | "language" | "is_active">>) => void;
  saving: boolean;
}) {
  const [name, setName] = useState(user.display_name);
  const [lang, setLang] = useState<GhlUser["language"]>(user.language);
  const [active, setActive] = useState(user.is_active);
  const dirty = name !== user.display_name || lang !== user.language || active !== user.is_active;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-mono text-xs text-muted-foreground">
            {user.ghl_user_id}
          </CardTitle>
          <Badge variant={user.is_active ? "default" : "secondary"}>
            {user.is_active ? "Activ" : "Inactiv"} · {languageLabel(user.language)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-[1fr_180px_120px_auto] sm:items-end">
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
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} id={`active-${user.ghl_user_id}`} />
          <label htmlFor={`active-${user.ghl_user_id}`} className="text-sm">Activ</label>
        </div>
        <Button
          size="sm"
          disabled={!dirty || saving}
          onClick={() => onSave({ display_name: name, language: lang, is_active: active })}
        >
          <Save className="mr-2 h-4 w-4" /> Salvează
        </Button>
      </CardContent>
    </Card>
  );
}
