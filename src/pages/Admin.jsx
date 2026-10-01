import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import AnnouncementManager from "@/components/admin/AnnouncementManager";
import ActivityFeed from "@/components/admin/ActivityFeed";
import StudentDirectory from "@/components/admin/StudentDirectory";
import AutoUpdateTools from "@/components/admin/AutoUpdateTools";

const EMPTY = { name: "", slug: "", category: "General AI", description: "", official_url: "", level: "Beginner", pricing: "Freemium" };

export default function Admin() {
  const { user } = useAuth();
  const [tools, setTools] = useState([]);
  const [counts, setCounts] = useState({});
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const { toast } = useToast();

  const load = () => {
    base44.entities.Tool.list({ sort: "-created_date", limit: 100 }).then((p) => setTools(p.items));
  };

  useEffect(() => {
    if (user?.role === "admin") {
      load();
      Promise.all([
        base44.entities.Tool.count({}),
        base44.entities.LearningPath.count({}),
        base44.entities.CodingProblem.count({}),
        base44.entities.Prompt.count({}),
        base44.entities.Activity.aggregate({ groupBy: "created_by_id", limit: 1000 }).then((r) => r.rows.length),
      ]).then(([toolsC, pathsC, problemsC, promptsC, studentsC]) => setCounts({ toolsC, pathsC, problemsC, promptsC, studentsC }));
    }
  }, [user]);

  if (!user) return <div className="max-w-3xl mx-auto px-4 py-16 text-sm text-muted-foreground">Loading...</div>;
  if (user?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-10 h-10 text-destructive mx-auto mb-3" />
        <h1 className="font-heading font-bold text-xl">Admins only</h1>
        <p className="text-sm text-muted-foreground mt-1">You don't have permission to view this page.</p>
      </div>
    );
  }

  const save = async () => {
    if (!editing.name || !editing.slug || !editing.description) {
      toast({ description: "Name, slug and description are required", variant: "destructive" });
      return;
    }
    if (editing.id) {
      await base44.entities.Tool.update(editing.id, editing);
    } else {
      await base44.entities.Tool.create(editing);
    }
    setEditing(null);
    load();
    toast({ description: "Tool saved" });
  };

  const confirmDelete = async () => {
    await base44.entities.Tool.delete(deleteId);
    setDeleteId(null);
    load();
    toast({ description: "Tool deleted" });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-3xl">Admin Dashboard</h1>
      <p className="text-muted-foreground mt-1">Manage the AI tools directory. Content updates instantly across the platform.</p>

      <div className="grid sm:grid-cols-5 gap-3 mt-6">
        {[
          ["Tools", counts.toolsC], ["Learning Paths", counts.pathsC], ["Coding Problems", counts.problemsC],
          ["Prompts", counts.promptsC], ["Active Students", counts.studentsC],
        ].map(([label, val]) => (
          <div key={label} className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-heading font-extrabold">{val ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <StudentDirectory />
      <AnnouncementManager />
      <ActivityFeed />

      <AutoUpdateTools onDone={load} />

      <div className="flex items-center justify-between mt-10 mb-3">
        <h2 className="font-heading font-bold text-lg">AI Tools</h2>
        <Button size="sm" className="gap-1.5" onClick={() => setEditing({ ...EMPTY })}>
          <Plus className="w-4 h-4" /> Add Tool
        </Button>
      </div>

      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card">
        {tools.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 p-3.5">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.category} · {t.slug}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setEditing(t)} className="p-2 text-muted-foreground hover:text-primary"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => setDeleteId(t.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Tool" : "Add Tool"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Slug</Label><Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className="mt-1" /></div>
              <div><Label>Category</Label><Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="mt-1" /></div>
              <div><Label>Description</Label><Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="mt-1" /></div>
              <div><Label>Official Website URL</Label><Input value={editing.official_url} onChange={(e) => setEditing({ ...editing, official_url: e.target.value })} className="mt-1" /></div>
              <Button onClick={save} className="w-full">Save Tool</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tool?</AlertDialogTitle>
            <AlertDialogDescription>This will remove it from the AI Tools directory for everyone. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}