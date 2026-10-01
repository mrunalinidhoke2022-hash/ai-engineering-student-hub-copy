import React from "react";
import moment from "moment";
import { ChevronLeft, ChevronRight, MessageSquare, Trash2, User } from "lucide-react";
import { TASK_STATUSES } from "./taskStatuses";

export default function TeamTaskCard({ task, dragging, offset, commentCount = 0, canEdit, selected, onDragStart, onToggleSelect, onOpenComments, onRequestDelete, onMove }) {
  const statusIndex = Math.max(0, TASK_STATUSES.findIndex((status) => status.key === task.status));
  const grab = (event) => canEdit && onDragStart?.(task, event);

  return (
    <div
      onPointerDown={grab}
      onMouseDown={grab}
      style={
        dragging
          ? {
              transform: `translate(${offset?.x || 0}px, ${offset?.y || 0}px)`,
              position: "relative",
              zIndex: 50,
              // Lets the pointer pass through to the column underneath while dragging.
              pointerEvents: "none",
            }
          : undefined
      }
      className={`bg-card border rounded-md px-3 py-2.5 shadow-sm cursor-grab active:cursor-grabbing ${
        dragging
          ? "border-primary ring-1 ring-primary shadow-md"
          : selected
            ? "border-primary bg-accent/40"
            : "border-border"
      }`}
    >
      <div className="flex items-start gap-2">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect(task.id)}
            className="mt-0.5 w-3.5 h-3.5 shrink-0 accent-primary cursor-pointer"
            aria-label={`Select ${task.title}`}
          />
        )}
        <p className="text-sm leading-5 flex-1 break-words">{task.title}</p>
        {canEdit && (
          <button
            type="button"
            onClick={() => onRequestDelete(task)}
            className="text-muted-foreground hover:text-destructive shrink-0"
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground">
        <User className="w-3 h-3 shrink-0" />
        <span className="truncate">{task.assignee || "Unassigned"}</span>
        <span className="ml-auto shrink-0">{moment(task.created_date).fromNow()}</span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onOpenComments(task)}
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary"
          aria-label={`Comments on ${task.title}`}
        >
          <MessageSquare className="w-3 h-3" />
          {commentCount > 0 ? `${commentCount} comment${commentCount === 1 ? "" : "s"}` : "Add comment"}
        </button>

        {canEdit && (
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => onMove?.(task, -1)}
              disabled={statusIndex <= 0}
              className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
              aria-label={`Move ${task.title} to the previous column`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove?.(task, 1)}
              disabled={statusIndex >= TASK_STATUSES.length - 1}
              className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:pointer-events-none"
              aria-label={`Move ${task.title} to the next column`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}