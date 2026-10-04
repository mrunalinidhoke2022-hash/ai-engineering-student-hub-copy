import React from "react";

const TONES = {
  xp: "bg-xp/15 text-xp",
  coin: "bg-coin/15 text-coin",
  gem: "bg-gem/15 text-gem",
  streak: "bg-streak/15 text-streak",
  success: "bg-success/15 text-success",
  primary: "bg-primary/15 text-primary",
};

// Rounded score tile: icon in a coloured disc, big rounded number, small label.
export default function StatTile({ icon: Icon, value, label, tone = "primary", className = "" }) {
  return (
    <div className={`rounded-2xl border-2 border-border bg-card px-2 py-3 text-center ${className}`}>
      <span className={`inline-flex w-9 h-9 items-center justify-center rounded-full ${TONES[tone] || TONES.primary}`}>
        <Icon className="w-4 h-4" />
      </span>
      <p className="font-game font-extrabold text-lg leading-tight mt-1.5">{value ?? 0}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}