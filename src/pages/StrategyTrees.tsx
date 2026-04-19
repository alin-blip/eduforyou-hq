import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, Plus, Save, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEntity } from "@/hooks/useEntity";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type TreeType = "value" | "profit" | "kpi";

interface TreeNode {
  id: string;
  label: string;
  metric?: string;
  value?: number;
  children: TreeNode[];
}

interface Tree {
  id?: string;
  name: string;
  type: TreeType;
  data: { nodes: TreeNode[] };
}

const TYPE_META: Record<TreeType, { title: string; description: string; rootLabel: string; color: string }> = {
  value: {
    title: "Value Tree",
    description: "Cum creezi valoare pentru client. Conectează propunerea de valoare la KPI-uri operaționale.",
    rootLabel: "Customer Value",
    color: "primary",
  },
  profit: {
    title: "Profit Tree",
    description: "Descompunerea profitului pe linii de business: revenue → cost → margin.",
    rootLabel: "Net Profit",
    color: "accent",
  },
  kpi: {
    title: "KPI Tree",
    description: "Cascadă companie → departamente → individual. Fiecare nivel contribuie la cel de deasupra.",
    rootLabel: "North Star Metric",
    color: "primary-glow",
  },
};

const newId = () => Math.random().toString(36).slice(2, 10);

const blankTree = (type: TreeType): Tree => ({
  name: TYPE_META[type].title,
  type,
  data: {
    nodes: [
      {
        id: newId(),
        label: TYPE_META[type].rootLabel,
        children: [],
      },
    ],
  },
});

export default function StrategyTreesPage() {
  const { current } = useEntity();
  const { user } = useAuth();
  const [activeType, setActiveType] = useState<TreeType>("value");
  const [trees, setTrees] = useState<Record<TreeType, Tree>>({
    value: blankTree("value"),
    profit: blankTree("profit"),
    kpi: blankTree("kpi"),
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    (async () => {
      const { data } = await supabase
        .from("strategy_trees")
        .select("*")
        .eq("entity_id", current.id);
      if (!data) return;
      const byType: Record<TreeType, Tree> = {
        value: blankTree("value"),
        profit: blankTree("profit"),
        kpi: blankTree("kpi"),
      };
      data.forEach((row: any) => {
        byType[row.type as TreeType] = {
          id: row.id,
          name: row.name,
          type: row.type,
          data: row.data,
        };
      });
      setTrees(byType);
    })();
  }, [current]);

  const updateActive = (updater: (t: Tree) => Tree) => {
    setTrees((prev) => ({ ...prev, [activeType]: updater(prev[activeType]) }));
  };

  const addChild = (parentId: string) => {
    const insert = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) =>
        n.id === parentId
          ? { ...n, children: [...n.children, { id: newId(), label: "Nou", children: [] }] }
          : { ...n, children: insert(n.children) },
      );
    updateActive((t) => ({ ...t, data: { nodes: insert(t.data.nodes) } }));
  };

  const updateNode = (id: string, patch: Partial<TreeNode>) => {
    const apply = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => (n.id === id ? { ...n, ...patch } : { ...n, children: apply(n.children) }));
    updateActive((t) => ({ ...t, data: { nodes: apply(t.data.nodes) } }));
  };

  const removeNode = (id: string) => {
    const apply = (nodes: TreeNode[]): TreeNode[] =>
      nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: apply(n.children) }));
    updateActive((t) => ({ ...t, data: { nodes: apply(t.data.nodes) } }));
  };

  const save = async () => {
    if (!current || !user) return;
    setSaving(true);
    const tree = trees[activeType];
    const payload = {
      entity_id: current.id,
      type: tree.type,
      name: tree.name,
      data: tree.data,
      created_by: user.id,
    };
    const { data, error } = tree.id
      ? await supabase.from("strategy_trees").update(payload).eq("id", tree.id).select().single()
      : await supabase.from("strategy_trees").insert(payload).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    if (data) {
      setTrees((prev) => ({ ...prev, [activeType]: { ...prev[activeType], id: data.id } }));
    }
    toast.success("Tree salvat");
  };

  const meta = TYPE_META[activeType];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs">
            <GitBranch className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Strategy Trees</span>
          </div>
          <h1 className="font-display text-3xl font-semibold">{meta.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{meta.description}</p>
        </div>
        <Button onClick={save} disabled={saving} className="bg-gradient-primary">
          <Save className="mr-2 h-4 w-4" /> {saving ? "Salvez…" : "Salvează"}
        </Button>
      </header>

      <Tabs value={activeType} onValueChange={(v) => setActiveType(v as TreeType)}>
        <TabsList className="bg-card/60">
          <TabsTrigger value="value">Value Tree</TabsTrigger>
          <TabsTrigger value="profit">Profit Tree</TabsTrigger>
          <TabsTrigger value="kpi">KPI Tree</TabsTrigger>
        </TabsList>

        {(["value", "profit", "kpi"] as TreeType[]).map((t) => (
          <TabsContent key={t} value={t} className="mt-6">
            <Card className="glass-card overflow-x-auto p-6">
              <NodeView
                nodes={trees[t].data.nodes}
                depth={0}
                onAdd={addChild}
                onUpdate={updateNode}
                onRemove={removeNode}
                color={meta.color}
              />
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function NodeView({
  nodes,
  depth,
  onAdd,
  onUpdate,
  onRemove,
  color,
}: {
  nodes: TreeNode[];
  depth: number;
  onAdd: (id: string) => void;
  onUpdate: (id: string, patch: Partial<TreeNode>) => void;
  onRemove: (id: string) => void;
  color: string;
}) {
  return (
    <div className={cn("space-y-2", depth > 0 && "ml-8 border-l border-border/40 pl-4")}>
      {nodes.map((node) => (
        <NodeRow
          key={node.id}
          node={node}
          depth={depth}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onRemove={onRemove}
          color={color}
        />
      ))}
    </div>
  );
}

function NodeRow({
  node,
  depth,
  onAdd,
  onUpdate,
  onRemove,
  color,
}: {
  node: TreeNode;
  depth: number;
  onAdd: (id: string) => void;
  onUpdate: (id: string, patch: Partial<TreeNode>) => void;
  onRemove: (id: string) => void;
  color: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasKids = node.children.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="group flex items-center gap-2 rounded-lg border border-border/50 bg-card/40 p-2 transition-colors hover:border-primary/40">
        {hasKids ? (
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className="h-4 w-4" />
        )}
        <div className={cn("h-2 w-2 shrink-0 rounded-full", `bg-${color}`)} />
        <Input
          value={node.label}
          onChange={(e) => onUpdate(node.id, { label: e.target.value })}
          className="h-8 flex-1 border-transparent bg-transparent focus:border-border"
        />
        <Input
          value={node.metric ?? ""}
          onChange={(e) => onUpdate(node.id, { metric: e.target.value })}
          placeholder="Metrică"
          className="h-8 w-32 text-xs"
        />
        <Input
          type="number"
          value={node.value ?? ""}
          onChange={(e) => onUpdate(node.id, { value: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Valoare"
          className="h-8 w-24 text-xs"
        />
        <Button variant="ghost" size="icon" onClick={() => onAdd(node.id)} className="h-7 w-7 opacity-60 group-hover:opacity-100">
          <Plus className="h-3.5 w-3.5" />
        </Button>
        {depth > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRemove(node.id)}
            className="h-7 w-7 text-destructive opacity-60 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {expanded && hasKids && (
        <NodeView
          nodes={node.children}
          depth={depth + 1}
          onAdd={onAdd}
          onUpdate={onUpdate}
          onRemove={onRemove}
          color={color}
        />
      )}
    </motion.div>
  );
}
