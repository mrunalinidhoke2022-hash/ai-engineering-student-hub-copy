import React from "react";

const SIZES = {
  sm: "h-2.5",
  md: "h-4",
  lg: "h-6",
};

// Chunky game-style progress bar: rounded track, gradient fill and a moving shine.
export default function XpBar({ value = 0, size = "md", className = "" }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className={`relative w-full rounded-full bg-secondary overflow-hidden ring-2 ring-border/60 ${SIZES[size] || SIZES.md} ${className}`}>
      <div
        className="relative h-full rounded-full bg-gradient-to-r from-xp via-primary to-gem transition-[width] duration-700 ease-out motion-reduce:transition-none"
        style={{ width: `${pct}%` }}
      >
        <span className="absolute inset-y-0 w-1/3 bg-white/40 blur-md animate-game-shine motion-reduce:hidden" />
      </div>
    </div>
  );
}