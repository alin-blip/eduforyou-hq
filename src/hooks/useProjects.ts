import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProjectStatus = "draft" | "live" | "paused" | "archived";

export type Project = {
  id: string;
  entity_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  status: ProjectStatus;
  category: string | null;
  public_url: string | null;
  edit_url: string | null;
  icon: string | null;
  color: string | null;
  owner_id: string | null;
  department_id: string | null;
  position: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectMetric = {
  id: string;
  project_id: string;
  metric_key: string;
  label: string;
  value: number;
  unit: string | null;
  delta_pct: number | null;
  trend: string | null;
  position: number;
  recorded_at: string;
  updated_at: string;
};

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [metrics, setMetrics] = useState<ProjectMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [pj, mt] = await Promise.all([
      supabase.from("projects").select("*").order("position", { ascending: true }),
      supabase.from("project_metrics").select("*").order("position", { ascending: true }),
    ]);
    if (pj.error) toast.error(pj.error.message);
    if (mt.error) toast.error(mt.error.message);
    setProjects((pj.data as Project[]) ?? []);
    setMetrics((mt.data as ProjectMetric[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createProject = async (payload: Partial<Project>) => {
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("projects").insert({
      name: payload.name ?? "Proiect nou",
      slug: payload.slug ?? `project-${Date.now()}`,
      description: payload.description ?? null,
      status: payload.status ?? "draft",
      category: payload.category ?? null,
      public_url: payload.public_url ?? null,
      edit_url: payload.edit_url ?? null,
      icon: payload.icon ?? "FolderKanban",
      color: payload.color ?? "primary",
      owner_id: payload.owner_id ?? u.user?.id ?? null,
      department_id: payload.department_id ?? null,
      created_by: u.user?.id ?? null,
    } as any);
    if (error) return toast.error(error.message);
    toast.success("Proiect creat");
    await refresh();
  };

  const updateProject = async (id: string, payload: Partial<Project>) => {
    const { error } = await supabase.from("projects").update(payload as any).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Actualizat");
    await refresh();
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Șters");
    await refresh();
  };

  const upsertMetric = async (payload: Partial<ProjectMetric> & { project_id: string; metric_key: string; label: string; value: number }) => {
    const { error } = await supabase.from("project_metrics").upsert({
      project_id: payload.project_id,
      metric_key: payload.metric_key,
      label: payload.label,
      value: payload.value,
      unit: payload.unit ?? null,
      delta_pct: payload.delta_pct ?? null,
      trend: payload.trend ?? null,
      position: payload.position ?? 0,
      recorded_at: new Date().toISOString(),
    } as any, { onConflict: "project_id,metric_key" });
    if (error) return toast.error(error.message);
    toast.success("Metrică salvată");
    await refresh();
  };

  const deleteMetric = async (id: string) => {
    const { error } = await supabase.from("project_metrics").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await refresh();
  };

  return {
    projects,
    metrics,
    loading,
    refresh,
    createProject,
    updateProject,
    deleteProject,
    upsertMetric,
    deleteMetric,
  };
}
