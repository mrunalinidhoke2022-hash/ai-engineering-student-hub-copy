import React, { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { ACHIEVEMENT_ICONS } from "@/components/quest/questLabels";
import { EMPTY_BADGE, ICON_KEYS } from "./questForms";

const CRITERIA = [
  ["xp_total", "Total XP"],
  ["lessons_completed", "Lessons completed"],
  ["challenges_solved", "Challenges solved"],
  ["streak_days", "Day streak"],
];

const SELECT_CLASS = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function QuestBadgeManager() {
  const { toast } = useToast();
  const [badges, setBadges] = useState([]);
  const [draft, setDraft] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => base44.entities.Achievement.list({ sort: "criteria_value", limit: 100 }).then((page) => setBadges(page.items || []));

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!draft.name.trim()) {
      toast({ description: "A badge name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await base44.functions.invoke("questAdmin", {
        action: "achievement.save",
        achievement: { ...draft, key: draft.key || draft.name },
      });
      toast({ description: "Badge saved" });
      setDraft(null);
      load();
    } catch (error) {
      toast({ description: error?.response?.data?.error || "That could not be saved", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("questAdmin", { action: "achievement.delete", id: deleteTarget.id });
      toast({ description: "Badge removed" });
      setDeleteTarget(null);
      load();
    } catch (error) {
      toast({ description: error?.response?.data?.error || "That could not be removed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-heading font-bold text-lg">CodeQuest badges</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Badges unlock automatically the moment a student passes the requirement.
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setDraft({ ...EMPTY_BADGE })}>
          <Plus className="w-4 h-4" /> Add badge
        </Button>
      </div>

      <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card mt-4">
        {loading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading badges...</p>
        ) : badges.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No badges yet — add the first one.</p>
        ) : (
          badges.map((badge) => {
            const Icon = ACHIEVEMENT_ICONS[badge.icon] || ACHIEVEMENT_ICONS.trophy;
            return (
              <div key={badge.id} className="flex items-center justify-between gap-3 p-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{badge.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {badge.criteria_value} {CRITERIA.find(([value]) => value === badge.criteria_type)?.[1] || badge.criteria_type} · +{badge.xp_reward ?? 0} XP
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setDraft(badge)} className="p-2 text-muted-foreground hover:text-primary">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(badge)} className="p-2 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{draft?.id ? "Edit badge" : "Add badge"}</DialogTitle></DialogHeader>
          {draft && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1" /></div>
              <div><Label>Description</Label><Textarea value={draft.description || ""} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className="mt-1" /></div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Icon</Label>
                  <select value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} className={`${SELECT_CLASS} mt-1`}>
                    {ICON_KEYS.map((icon) => (<option key={icon} value={icon}>{icon}</option>))}
                  </select>
                </div>
                <div>
                  <Label>Unlocks when</Label>
                  <select value={draft.criteria_type} onChange={(e) => setDraft({ ...draft, criteria_type: e.target.value })} className={`${SELECT_CLASS} mt-1`}>
                    {CRITERIA.map(([value, label]) => (<option key={value} value={value}>{label}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><Label>Requirement</Label><Input type="number" min="1" value={draft.criteria_value} onChange={(e) => setDraft({ ...draft, criteria_value: Number(e.target.value) })} className="mt-1" /></div>
                <div><Label>Bonus XP</Label><Input type="number" min="0" value={draft.xp_reward} onChange={(e) => setDraft({ ...draft, xp_reward: Number(e.target.value) })} className="mt-1" /></div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={draft.enabled !== false} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
                Active
              </label>
              <Button onClick={save} disabled={saving} className="w-full gap-1.5">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save badge
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Students who already earned it keep their XP. It can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}