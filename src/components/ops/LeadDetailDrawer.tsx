import { ExternalLink, Mail, Phone, Tag, User2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { type OpsLead, type GhlNote, hoursSince, isBreach } from "@/hooks/useOpsLeads";
import { useGhlUsers, languageLabel } from "@/hooks/useGhlUsers";

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("ro-RO", { dateStyle: "medium", timeStyle: "short" });
}

function fmtAging(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  return `${Math.round(hours / 24)}d`;
}

export function LeadDetailDrawer({
  lead,
  open,
  onOpenChange,
  ghlLocationId,
}: {
  lead: OpsLead | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  ghlLocationId?: string | null;
}) {
  const { map: usersMap } = useGhlUsers();

  if (!lead) return null;

  const aging = hoursSince(lead.ghl_updated_at);
  const breach = isBreach(lead.stage_name, aging);
  const assignee = lead.assigned_to ? usersMap.get(lead.assigned_to) : undefined;

  const sortedNotes: GhlNote[] = [...(lead.notes ?? [])].sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  const ghlUrl = ghlLocationId
    ? `https://app.gohighlevel.com/v2/location/${ghlLocationId}/contacts/detail/${lead.ghl_contact_id}`
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-hidden p-0 sm:max-w-xl">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="truncate">
            {lead.full_name || lead.email || lead.phone || "Lead fără nume"}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{lead.stage_name ?? "—"}</Badge>
            <span className={breach ? "text-destructive" : ""}>
              {fmtAging(aging)} în stage
            </span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <div className="space-y-5 px-6 py-5">
            <div className="space-y-2 text-sm">
              {lead.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                </div>
              )}
              <div className="flex items-center gap-2">
                <User2 className="h-4 w-4 text-muted-foreground" />
                <span>
                  {assignee ? (
                    <>
                      {assignee.display_name}{" "}
                      <Badge variant="outline" className="ml-1 text-[10px]">
                        {languageLabel(assignee.language)}
                      </Badge>
                    </>
                  ) : lead.assigned_to ? (
                    <span className="text-muted-foreground">{lead.assigned_to}</span>
                  ) : (
                    <span className="text-muted-foreground">Nealocat</span>
                  )}
                </span>
              </div>
              {lead.source && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Source: {lead.source}</span>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                Creat: {fmtDate(lead.ghl_created_at)} · Update: {fmtDate(lead.ghl_updated_at)}
              </div>
            </div>

            {ghlUrl && (
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={ghlUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open in GHL
                </a>
              </Button>
            )}

            <Separator />

            <div>
              <h3 className="mb-3 text-sm font-semibold">
                Notes consultant{" "}
                <span className="text-muted-foreground">({sortedNotes.length})</span>
              </h3>
              {sortedNotes.length === 0 ? (
                <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  Nicio notiță sincronizată. Notițele se trag doar pentru leads din stage-uri descalificate (Refuz, Picat, etc.).
                </p>
              ) : (
                <ul className="space-y-3">
                  {sortedNotes.map((n, i) => {
                    const author = n.userId ? usersMap.get(n.userId) : undefined;
                    return (
                      <li key={n.id ?? i} className="rounded-md border bg-muted/30 p-3 text-sm">
                        <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {author?.display_name ?? n.userId ?? "Necunoscut"}
                          </span>
                          <span>{fmtDate(n.createdAt)}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {n.body ?? "(gol)"}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
