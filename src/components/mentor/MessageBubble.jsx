import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { CheckCircle2, ChevronDown, ChevronRight, Loader2, Wrench, XCircle } from "lucide-react";

const FAILED = /error|failed/i;

const parseJson = (value) => {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const toolFailed = (toolCall) => {
  const status = String(toolCall.status || "").toLowerCase();
  if (status === "failed" || status === "error") return true;
  const parsed = parseJson(toolCall.results);
  if (parsed && parsed.success === false) return true;
  const raw = typeof toolCall.results === "string" ? toolCall.results : JSON.stringify(toolCall.results ?? "");
  return FAILED.test(raw);
};

const toolRunning = (toolCall) =>
  ["pending", "running", "in_progress"].includes(String(toolCall.status || "").toLowerCase());

const pretty = (value) => {
  const parsed = parseJson(value);
  return parsed ? JSON.stringify(parsed, null, 2) : String(value ?? "");
};

const prettyName = (name) =>
  String(name || "working").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function ToolCallDisplay({ toolCall }) {
  const [open, setOpen] = useState(false);
  const projection = toolCall.display_projection || {};
  const hidden = projection.hide_details && projection.details_redacted;
  const running = toolRunning(toolCall);
  const failed = toolFailed(toolCall);
  const label = hidden
    ? (running ? projection.active_label : failed ? projection.error_label : projection.label) || "Working"
    : prettyName(toolCall.name);
  const Icon = running ? Loader2 : failed ? XCircle : CheckCircle2;

  if (hidden) {
    return (
      <div className="mt-2 text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Icon className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} /> {label}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-2 text-xs">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Wrench className="w-3.5 h-3.5" />
        <span>{label}</span>
        <Icon className={`w-3.5 h-3.5 ${running ? "animate-spin" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 rounded-md bg-muted p-2 font-mono text-[11px] whitespace-pre-wrap break-words">
          {toolCall.arguments_string && (
            <>
              <p className="font-semibold">Parameters</p>
              <p>{pretty(toolCall.arguments_string)}</p>
            </>
          )}
          {toolCall.results != null && (
            <>
              <p className="font-semibold mt-2">Result</p>
              <p>{pretty(toolCall.results)}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg p-3.5 text-sm ${
          isUser ? "bg-primary text-primary-foreground" : "bg-card border border-border"
        }`}
      >
        {message.content &&
          (isUser ? (
            <p className="whitespace-pre-line">{message.content}</p>
          ) : (
            <div className="space-y-2 break-words [&_a]:underline [&_code]:font-mono [&_code]:text-[0.85em] [&_h1]:font-heading [&_h1]:font-bold [&_h2]:font-heading [&_h2]:font-bold [&_h3]:font-heading [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_ul]:list-disc">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          ))}
        {message.tool_calls?.map((toolCall, idx) => (
          <ToolCallDisplay key={idx} toolCall={toolCall} />
        ))}
      </div>
    </div>
  );
}