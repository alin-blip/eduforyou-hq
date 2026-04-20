import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useProjects, type Project, type ProjectStatus } from "@/hooks/useProjects";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project | null;
}

export function ProjectDialog({ open, onOpenChange, project }: Props) {
  const { createProject, updateProject, deleteProject } = useProjects();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("draft");
  const [category, setCategory] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [icon, setIcon] = useState("FolderKanban");

  useEffect(() => {
    if (project) {
      setName(project.name);
      setSlug(project.slug);
      setDescription(project.description ?? "");
      setStatus(project.status);
      setCategory(project.category ?? "");
      setPublicUrl(project.public_url ?? "");
      setEditUrl(project.edit_url ?? "");
      setIcon(project.icon ?? "FolderKanban");
    } else {
      setName("");
      setSlug("");
      setDescription("");
      setStatus("draft");
      setCategory("");
      setPublicUrl("");
      setEditUrl("");
      setIcon("FolderKanban");
    }
  }, [project, open]);

  const handleSave = async () => {
    const payload = {
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
      description: description || null,
      status,
      category: category || null,
      public_url: publicUrl || null,
      edit_url: editUrl || null,
      icon,
    };
    if (project) await updateProject(project.id, payload as any);
    else await createProject(payload as any);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{project ? "Editează proiect" : "Proiect nou"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nume</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generat" />
            </div>
            <div>
              <Label>Categorie</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="platform / saas" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Icon (Lucide)</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="FolderKanban" />
            </div>
          </div>
          <div>
            <Label>Descriere</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>URL public</Label>
            <Input value={publicUrl} onChange={(e) => setPublicUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>URL editare (Lovable)</Label>
            <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://lovable.dev/projects/..." />
          </div>
        </div>
        <DialogFooter>
          {project && (
            <Button variant="destructive" className="mr-auto" onClick={async () => { await deleteProject(project.id); onOpenChange(false); }}>
              Șterge
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Anulează</Button>
          <Button onClick={handleSave}>{project ? "Salvează" : "Creează"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
