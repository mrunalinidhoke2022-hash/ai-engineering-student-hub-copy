import React from "react";
import { ArrowRight, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function KanbanBulkBar({ count, moveTargets, busy, onMove, onDelete, onClear }) {
  if (!count) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-accent/60 px-3 py-2">
      <span className="text-xs font-semibold">
        {count} task{count === 1 ? "" : "s"} selected
      </span>

      {moveTargets.length > 0 && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <ArrowRight className="w-3 h-3" /> Move to
        </span>
      )}

      {moveTargets.map((status) => (
        <Button key={status.key} size="sm" variant="outline" disabled={busy} onClick={() => onMove(status.key)}>
          {status.label}
        </Button>
      ))}

      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={onDelete}
        className="gap-1.5 text-destructive hover:text-destructive"
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete
      </Button>

      <Button size="sm" variant="ghost" disabled={busy} onClick={onClear} className="ml-auto gap-1">
        <X className="w-3.5 h-3.5" /> Clear
      </Button>
    </div>
  );
}