import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES = ["Site Update", "New Feature", "Hackathon", "Deadline", "Event", "General"];
const EMPTY = { title: "", message: "", category: "Site Update", link: "" };

export default function AnnouncementManager() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    base44.entities.Announcement.filter({}, { sort: "-created_date", limit: 25 }).then((p) => setItems(p.items));
  };

  useEffect(() => {
    load();
  }, []);

  const publish = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast({ description: "Title and message are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    await base44.entities.Announcement.create(form);
    setForm(EMPTY);
    setSaving(false);
    load();
    toast({ description: "Notification sent to all students" });
  };

  const remove = async (id) => {
    await base44.entities.Announcement.delete(id);
    load();
    toast({ description: "Notification removed" });
  };

  return (
    <section className="mt-10">
      <h2 className="font-heading font-bold text-lg">Send a Notification</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Posts to every student's notification panel — site updates, new features, hackathon alerts and deadlines.
      </p>

      <div className="mt-4 bg-card border border-border rounded-lg p-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1" placeholder="e.g. New coding problems added" />
          </div>
          <div>
            <Label>Type</Label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <Label>Message</Label>
          <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1" rows={2} placeholder="Tell students what's new..." />
        </div>
        <div>
          <Label>Link (optional)</Label>
          <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="mt-1" placeholder="/hackathon-hub" />
        </div>
        <Button onClick={publish} disabled={saving} className="gap-1.5">
          <Plus className="w-4 h-4" /> {saving ? "Publishing..." : "Publish Notification"}
        </Button>
      </div>

      {items.length > 0 && (
        <div className="mt-3 border border-border rounded-lg divide-y divide-border overflow-hidden bg-card">
          {items.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3 p-3.5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-primary">{a.category}</p>
                <p className="font-semibold text-sm">{a.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{a.message}</p>
              </div>
              <button onClick={() => remove(a.id)} className="p-2 text-muted-foreground hover:text-destructive shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}