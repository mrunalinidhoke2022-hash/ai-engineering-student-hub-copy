import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";

const FOCUS_OPTIONS = [
  "Hackathon",
  "Final Year Project",
  "Mini Project",
  "Study Group",
  "Startup Idea",
  "Competition",
  "Other",
];

const EMPTY = { name: "", focus: "Hackathon", description: "", goal: "" };

export default function TeamFormDialog({ open, onOpenChange, user, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const close = (next) => {
    if (!next) {
      setForm(EMPTY);
      setError("");
    }
    onOpenChange(next);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      setError("Team name and a short description are required.");
      return;
    }
    setSaving(true);
    setError("");
    const name = user?.full_name || user?.email || "Team lead";
    const team = await base44.entities.Team.create({
      name: form.name.trim(),
      description: form.description.trim(),
      focus: form.focus,
      goal: form.goal.trim(),
      lead_name: name,
      members: user?.id ? [user.id] : [],
      member_names: [name],
    });
    setSaving(false);
    setForm(EMPTY);
    onCreated(team);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Team name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Team Vision"
              className="mt-1"
            />
          </div>
          <div>
            <Label>What kind of team is it?</Label>
            <select
              value={form.focus}
              onChange={(e) => setForm({ ...form, focus: e.target.value })}
              className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {FOCUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Team goal</Label>
            <Input
              value={form.goal}
              onChange={(e) => setForm({ ...form, goal: e.target.value })}
              placeholder="e.g. Submit a working prototype by 20 Nov"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What are you building and who are you looking for?"
              className="mt-1"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? "Creating team..." : "Create team"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}