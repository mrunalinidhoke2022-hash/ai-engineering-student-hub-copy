import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TeamTaskCard from "./TeamTaskCard";

export default function KanbanColumn({
  column,
  tasks,
  assignees,
  commentCounts,
  canEdit,
  selectedIds,
  onToggleSelect,
  dragId,
  dragOffset,
  isDropTarget,
  onDragStart,
  onAdd,
  onOpenComments,
  onRequestDelete,
  onMove,
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");

  const submit = async () => {
    const text = title.trim();
    if (!text) return;
    await onAdd(column.key, text, assignee);
    setTitle("");
    setAssignee("");
    setAdding(false);
  };

  return (
    <div
      data-drop-status={column.key}
      className={`rounded-lg border p-3 flex flex-col min-h-[220px] ${
        isDropTarget ? "border-primary/50 bg-accent/60" : "border-border bg-secondary/40"
      }`}
    >
      <div className="flex items-center gap-2 px-1">
        <span className={`w-2 h-2 rounded-full ${column.dot}`} />
        <p className="font-heading font-bold text-sm">{column.label}</p>
        <span className="ml-auto text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      <div className="mt-3 space-y-2 flex-1">
        {tasks.map((task) => (
          <TeamTaskCard
            key={task.id}
            task={task}
            dragging={dragId === task.id}
            offset={dragOffset}
            commentCount={commentCounts?.[task.id] || 0}
            canEdit={canEdit}
            selected={selectedIds?.includes(task.id)}
            onToggleSelect={onToggleSelect}
            onDragStart={onDragStart}
            onOpenComments={onOpenComments}
            onRequestDelete={onRequestDelete}
            onMove={onMove}
          />
        ))}
      </div>

      {canEdit &&
        (adding ? (
          <div className="mt-3 space-y-2">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Task title"
              className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            {assignees.length > 0 && (
              <Select value={assignee} onValueChange={(value) => setAssignee(value === "__unassigned__" ? "" : value)}>
                <SelectTrigger className="w-full h-8 px-2 text-sm">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassigned__">Unassigned</SelectItem>
                  {assignees.map((name, index) => (
                    <SelectItem key={`${name}-${index}`} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={submit} disabled={!title.trim()}>
                Add
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setAdding(true)}
            className="mt-3 justify-start gap-1.5 text-muted-foreground w-full"
          >
            <Plus className="w-3.5 h-3.5" /> Add task
          </Button>
        ))}
    </div>
  );
}