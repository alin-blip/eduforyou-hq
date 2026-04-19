import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye, Plus, Save, Sparkles, Target, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEntity } from "@/hooks/useEntity";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Milestone {
  year: number;
  title: string;
  metric: string;
}

interface VisionRow {
  id?: string;
  story: string;
  mission: string;
  brand_promise: string;
  bhag: string;
  core_values: string[];
  milestones: Milestone[];
  target_year: number;
}

const empty: VisionRow = {
  story: "",
  mission: "",
  brand_promise: "",
  bhag: "",
  core_values: [],
  milestones: [],
  target_year: new Date().getFullYear() + 3,
};

export default function VisionPage() {
  const { current } = useEntity();
  const { user, isAdmin } = useAuth();
  const [vision, setVision] = useState<VisionRow>(empty);
  const [newValue, setNewValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!current) return;
    (async () => {
      const { data } = await supabase
        .from("vision")
        .select("*")
        .eq("entity_id", current.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        setVision({
          id: data.id,
          story: data.story ?? "",
          mission: data.mission ?? "",
          brand_promise: data.brand_promise ?? "",
          bhag: data.bhag ?? "",
          core_values: (data.core_values as string[]) ?? [],
          milestones: (data.milestones as Milestone[]) ?? [],
          target_year: data.target_year ?? empty.target_year,
        });
      }
    })();
  }, [current]);

  const save = async () => {
    if (!current || !user) return;
    setSaving(true);
    const payload = {
      entity_id: current.id,
      story: vision.story,
      mission: vision.mission,
      brand_promise: vision.brand_promise,
      bhag: vision.bhag,
      core_values: vision.core_values,
      milestones: vision.milestones,
      target_year: vision.target_year,
      created_by: user.id,
    };
    const { data, error } = vision.id
      ? await supabase.from("vision").update(payload).eq("id", vision.id).select().single()
      : await supabase.from("vision").insert(payload).select().single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) setVision((v) => ({ ...v, id: data.id }));
    toast.success("Vision salvat");
  };

  const addValue = () => {
    if (!newValue.trim()) return;
    setVision((v) => ({ ...v, core_values: [...v.core_values, newValue.trim()] }));
    setNewValue("");
  };
  const removeValue = (i: number) =>
    setVision((v) => ({ ...v, core_values: v.core_values.filter((_, idx) => idx !== i) }));

  const addMilestone = () => {
    setVision((v) => ({
      ...v,
      milestones: [...v.milestones, { year: new Date().getFullYear() + v.milestones.length + 1, title: "", metric: "" }],
    }));
  };
  const updateMilestone = (i: number, patch: Partial<Milestone>) =>
    setVision((v) => ({
      ...v,
      milestones: v.milestones.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
    }));
  const removeMilestone = (i: number) =>
    setVision((v) => ({ ...v, milestones: v.milestones.filter((_, idx) => idx !== i) }));

  const canEdit = isAdmin || true; // managers also via RLS

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/50 bg-card/50 px-3 py-1 text-xs">
            <Eye className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">Vivid VISION</span>
          </div>
          <h1 className="font-display text-3xl font-semibold">Strategie pe 3 ani</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Definește destinația companiei. OKR-urile trimestriale se vor alinia automat la milestones.
          </p>
        </div>
        {canEdit && (
          <Button onClick={save} disabled={saving} className="bg-gradient-primary">
            <Save className="mr-2 h-4 w-4" /> {saving ? "Salvez…" : "Salvează"}
          </Button>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-card space-y-3 p-6">
          <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Vision Story
          </label>
          <Textarea
            value={vision.story}
            onChange={(e) => setVision({ ...vision, story: e.target.value })}
            placeholder="În 2028, EduForYou este…"
            rows={6}
            className="resize-none"
          />
          <p className="text-[10px] text-muted-foreground">
            Scrie la prezent, ca și cum ai ajuns deja acolo. Imaginea trebuie să fie vie, concretă.
          </p>
        </Card>

        <Card className="glass-card space-y-4 p-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Mission
            </label>
            <Textarea
              value={vision.mission}
              onChange={(e) => setVision({ ...vision, mission: e.target.value })}
              placeholder="Why do we exist?"
              rows={2}
              className="mt-2 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Brand Promise
            </label>
            <Input
              value={vision.brand_promise}
              onChange={(e) => setVision({ ...vision, brand_promise: e.target.value })}
              placeholder="Ce promitem clienților?"
              className="mt-2"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3 w-3 text-warning" /> BHAG · Big Hairy Audacious Goal
            </label>
            <Input
              value={vision.bhag}
              onChange={(e) => setVision({ ...vision, bhag: e.target.value })}
              placeholder="Ex: 100.000 studenți activi până în 2030"
              className="mt-2"
            />
          </div>
        </Card>
      </div>

      <Card className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Core Values</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {vision.core_values.map((v, i) => (
            <Badge
              key={i}
              variant="secondary"
              className="gap-1 bg-primary/10 px-3 py-1 text-xs text-primary"
            >
              {v}
              <button onClick={() => removeValue(i)} className="ml-1 opacity-60 hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Ex: Excelență educațională"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addValue())}
          />
          <Button variant="outline" onClick={addValue}>
            <Plus className="mr-1 h-3 w-3" /> Adaugă
          </Button>
        </div>
      </Card>

      <Card className="glass-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Milestones · 3 ani</h2>
            <p className="text-xs text-muted-foreground">
              Reperele anuale care duc la BHAG. Fiecare milestone va informa OKR-urile trimestriale.
            </p>
          </div>
          <Button variant="outline" onClick={addMilestone}>
            <Plus className="mr-1 h-3 w-3" /> Adaugă milestone
          </Button>
        </div>

        <div className="relative space-y-3">
          {vision.milestones.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Niciun milestone încă. Adaugă cel puțin 3 (an 1, 2, 3).
            </p>
          )}
          {vision.milestones.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="grid grid-cols-12 items-center gap-3 rounded-lg border border-border/50 bg-card/40 p-3"
            >
              <div className="col-span-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <Input
                  type="number"
                  value={m.year}
                  onChange={(e) => updateMilestone(i, { year: Number(e.target.value) })}
                  className="h-8"
                />
              </div>
              <Input
                value={m.title}
                onChange={(e) => updateMilestone(i, { title: e.target.value })}
                placeholder="Titlu milestone"
                className="col-span-5 h-8"
              />
              <Input
                value={m.metric}
                onChange={(e) => updateMilestone(i, { metric: e.target.value })}
                placeholder="Metrică (ex: €1M MRR)"
                className="col-span-4 h-8"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeMilestone(i)}
                className="col-span-1 text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
