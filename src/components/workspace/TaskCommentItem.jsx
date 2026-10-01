import React from "react";
import moment from "moment";
import { Trash2 } from "lucide-react";

export default function TaskCommentItem({ comment, canDelete, onDelete }) {
  const initial = (comment.author_name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center shrink-0">
        {initial || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold truncate">{comment.author_name || "Teammate"}</p>
          <span className="text-[10px] text-muted-foreground shrink-0">{moment(comment.created_date).fromNow()}</span>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDelete(comment)}
              className="ml-auto text-muted-foreground hover:text-destructive shrink-0"
              aria-label="Delete comment"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{comment.message}</p>
      </div>
    </div>
  );
}