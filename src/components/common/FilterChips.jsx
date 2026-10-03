import React from "react";

export default function FilterChips({ options, value, onChange, allLabel = "All", labelFor }) {
  const label = (option) => (labelFor ? labelFor(option) : option);
  const base =
    "inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-full text-xs font-semibold border transition-colors";

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange("")}
        className={`${base} ${
          value === "" ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40"
        }`}
      >
        {allLabel}
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`${base} ${
            value === opt ? "bg-primary text-white border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/40"
          }`}
        >
          {label(opt)}
        </button>
      ))}
    </div>
  );
}