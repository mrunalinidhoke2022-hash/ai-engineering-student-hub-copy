import React from "react";

export default function FilterChips({ options, value, onChange, allLabel = "All", labelFor }) {
  const label = (option) => (labelFor ? labelFor(option) : option);

  return (
    <div className="flex gap-2 flex-wrap">
      <button
        onClick={() => onChange("")}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
          value === "" ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"
        }`}
      >
        {allLabel}
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
            value === opt ? "bg-primary text-white border-primary" : "bg-white text-muted-foreground border-border hover:border-primary/40"
          }`}
        >
          {label(opt)}
        </button>
      ))}
    </div>
  );
}