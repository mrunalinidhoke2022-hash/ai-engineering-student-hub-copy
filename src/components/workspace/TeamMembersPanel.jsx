import React, { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeamMembersPanel({ team, canAdd, onAddMember }) {
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const names = (team.member_names || []).map((name) => String(name || "Teammate"));

  const submit = async () => {
    const value = email.trim();
    if (!value) return;
    setAdding(true);
    const added = await onAddMember(value);
    setAdding(false);
    if (added) setEmail("");
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 h-fit">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-bold text-sm">Members ({names.length})</h3>
      </div>

      <ul className="mt-3 space-y-2">
        {names.map((name, index) => (
          <li key={`${name}-${index}`} className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-accent text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
              {name.slice(0, 1).toUpperCase()}
            </span>
            <span className="text-sm truncate">{name}</span>
            {index === 0 && (
              <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shrink-0">
                Lead
              </span>
            )}
          </li>
        ))}
      </ul>

      {canAdd && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Add a member</p>
          <div className="flex gap-2 mt-2">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submit()}
              placeholder="classmate@email.com"
              className="flex-1 min-w-0 h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button size="sm" onClick={submit} disabled={!email.trim() || adding} className="shrink-0 gap-1.5">
              <UserPlus className="w-3.5 h-3.5" />
              {adding ? "Adding..." : "Add"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Use the email they registered with. A team holds up to 8 members.
          </p>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground mt-4 border-t border-border pt-3">
        Everyone here sees the same shared roadmap and team updates.
      </p>
    </div>
  );
}