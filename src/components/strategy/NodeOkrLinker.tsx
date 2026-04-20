import { useState, useMemo } from "react";
import { Link2, Plus, Target, X, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  useObjectives,
  useCreateObjective,
  useCreateKeyResult,
  currentQuarter,
} from "@/hooks/useOkr";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NodeOkrLink {
  objective_id?: string;
  key_result_id?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  nodeLabel: string;
  currentLink: NodeOkrLink;
  onLink: (link: NodeOkrLink) => void;
}

export function NodeOkrLinker({ open, onOpenChange, nodeLabel, currentLink, onLink }: Props) {
  const { user } = useAuth();
  const { data: objectives } = useObjectives();
  const createObj = useCreateObjective();
  const createKr = useCreateKeyResult();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("link");
  const [newObjTitle, setNewObjTitle] = useState(nodeLabel);
  const [newKrParent, setNewKrParent] = useState<string>("");
  const [newKrTarget, setNewKrTarget] = useState(100);
  const [newKrUnit, setNewKrUnit] = useState("");

  const filtered = useMemo(() => {
    if (!objectives) return [];
    const s = search.toLowerCase();
    return objectives.filter(
      (o) =>
        o.title.toLowerCase().includes(s) ||
        o.key_results.some((k) => k.title.toLowerCase().includes(s)),
    );
  }, [objectives, search]);

  const handleLinkObjective = (id: string) => {
    onLink({ objective_id: id });
    toast.success("Obiectiv linkat");
    onOpenChange(false);
  };

  const handleLinkKr = (id: string) => {
    onLink({ key_result_id: id });
    toast.success("Key Result linkat");
    onOpenChange(false);
  };

  const handleUnlink = () => {
    onLink({});
    toast.success("Link eliminat");
    onOpenChange(false);
  };

  const handleCreateObjective = async () => {
    if (!newObjTitle.trim() || !user) return;
    try {
      const obj = await createObj.mutateAsync({
        title: newObjTitle.trim(),
        quarter: currentQuarter(),
        level: "company",
        status: "on_track",
        progress: 0,
        created_by: user.id,
      });
      onLink({ objective_id: obj.id });
      toast.success("Obiectiv creat și linkat");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare");
    }
  };

  const handleCreateKr = async () => {
    if (!newKrParent || !newObjTitle.trim()) return;
    try {
      const kr = await createKr.mutateAsync({
        objective_id: newKrParent,
        title: newObjTitle.trim(),
        target_value: newKrTarget,
        start_value: 0,
        current_value: 0,
        metric_unit: newKrUnit || null,
        status: "not_started",
      });
      onLink({ key_result_id: kr.id });
      toast.success("Key Result creat și linkat");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eroare");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" /> Conectează la OKR
          </DialogTitle>
          <DialogDescription>
            Nod: <span className="font-medium text-foreground">{nodeLabel}</span> · Progresul nodului va urma valoarea din OKR.
          </DialogDescription>
        </DialogHeader>

        {(currentLink.objective_id || currentLink.key_result_id) && (
          <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-primary" />
              <span>Linkat cu un {currentLink.objective_id ? "Obiectiv" : "Key Result"}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleUnlink}>
              <X className="mr-1 h-3 w-3" /> Elimină link
            </Button>
          </div>
        )}

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-card/60">
            <TabsTrigger value="link">Linkează existent</TabsTrigger>
            <TabsTrigger value="new-obj">Obiectiv nou</TabsTrigger>
            <TabsTrigger value="new-kr">Key Result nou</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="mt-4 space-y-3">
            <Input
              placeholder="Caută obiectiv sau KR…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ScrollArea className="h-72 rounded-lg border border-border/50">
              <div className="space-y-2 p-2">
                {filtered.length === 0 && (
                  <p className="p-4 text-center text-sm text-muted-foreground">
                    Niciun obiectiv găsit. Creează unul nou din tab-urile alăturate.
                  </p>
                )}
                {filtered.map((o) => (
                  <div key={o.id} className="rounded-lg border border-border/40 bg-card/40 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Target className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate">{o.title}</span>
                        </div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {o.quarter} · {o.level} · {o.progress}%
                        </div>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleLinkObjective(o.id)}>
                        Link obiectiv
                      </Button>
                    </div>
                    {o.key_results.length > 0 && (
                      <div className="mt-2 space-y-1 border-l border-border/40 pl-3">
                        {o.key_results.map((k) => (
                          <div key={k.id} className="flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-muted-foreground">
                              {k.title}{" "}
                              <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                                {k.current_value}/{k.target_value} {k.metric_unit ?? ""}
                              </Badge>
                            </span>
                            <Button size="sm" variant="ghost" onClick={() => handleLinkKr(k.id)}>
                              Link KR
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="text-xs text-muted-foreground">
              <Link to="/okr" className="inline-flex items-center gap-1 hover:text-primary">
                Vezi toate OKR-urile <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="new-obj" className="mt-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Titlu obiectiv</label>
              <Input value={newObjTitle} onChange={(e) => setNewObjTitle(e.target.value)} />
              <p className="text-xs text-muted-foreground">
                Se creează un obiectiv pentru trimestrul curent ({currentQuarter()}), nivel companie.
              </p>
            </div>
            <Button
              onClick={handleCreateObjective}
              disabled={createObj.isPending || !newObjTitle.trim()}
              className="bg-gradient-primary"
            >
              <Plus className="mr-2 h-4 w-4" /> Creează & linkează
            </Button>
          </TabsContent>

          <TabsContent value="new-kr" className="mt-4 space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Obiectiv părinte</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newKrParent}
                onChange={(e) => setNewKrParent(e.target.value)}
              >
                <option value="">Alege obiectiv…</option>
                {objectives?.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Titlu KR</label>
              <Input value={newObjTitle} onChange={(e) => setNewObjTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Target</label>
                <Input
                  type="number"
                  value={newKrTarget}
                  onChange={(e) => setNewKrTarget(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase text-muted-foreground">Unitate</label>
                <Input
                  placeholder="EUR, %, leads"
                  value={newKrUnit}
                  onChange={(e) => setNewKrUnit(e.target.value)}
                />
              </div>
            </div>
            <Button
              onClick={handleCreateKr}
              disabled={createKr.isPending || !newKrParent || !newObjTitle.trim()}
              className="bg-gradient-primary"
            >
              <Plus className="mr-2 h-4 w-4" /> Creează & linkează
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
