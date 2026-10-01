import React from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TeamCard({ team, isMember, active, busy, onOpen, onJoin }) {
  const count = (team.members || []).length;

  return (
    <div
      className={`bg-card border rounded-lg p-4 flex flex-col transition-colors ${
        active ? "border-primary ring-1 ring-primary" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading font-bold text-sm truncate">{team.name}</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-primary mt-1">
            {team.focus || "Project team"}
          </p>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
          <Users className="w-3.5 h-3.5" /> {count}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mt-2 leading-5 max-h-10 overflow-hidden flex-1">{team.description}</p>

      {team.goal && <p className="text-[11px] text-muted-foreground mt-2">Goal: {team.goal}</p>}

      <Button
        size="sm"
        variant={isMember ? "outline" : "default"}
        className="mt-3 w-full"
        disabled={busy}
        onClick={() => (isMember ? onOpen(team.id) : onJoin(team.id))}
      >
        {busy ? "Please wait..." : isMember ? (active ? "Open workspace" : "Open workspace") : "Join team"}
      </Button>
    </div>
  );
}