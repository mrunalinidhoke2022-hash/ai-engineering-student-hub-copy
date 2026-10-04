import React from "react";

const DOT_COLORS = ["bg-destructive", "bg-warning", "bg-success"];

// Terminal-style panel: the coding surface of a CodeQuest level, so writing code
// and reading examples feels like working in a console instead of a plain box.
export default function QuestTerminal({ title, prompt = "$", output, children, className = "" }) {
  return (
    <div className={`rounded-2xl border-2 border-border bg-card overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-border bg-secondary/60">
        <span className="flex gap-1.5" aria-hidden="true">
          {DOT_COLORS.map((color) => (
            <span key={color} className={`w-2.5 h-2.5 rounded-full ${color}`} />
          ))}
        </span>
        {title && <p className="font-mono text-[11px] text-muted-foreground ml-1 truncate">{title}</p>}
      </div>

      <div className={`flex gap-2 p-3 bg-black/30 ${prompt ? "" : "block"}`}>
        {prompt && (
          <span className="font-mono text-xs text-success select-none" aria-hidden="true">
            {prompt}
          </span>
        )}
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {output != null && output !== "" && (
        <div className="border-t-2 border-border bg-black/30 px-3 py-2">
          <p className="font-mono text-xs whitespace-pre-wrap">{output}</p>
        </div>
      )}
    </div>
  );
}