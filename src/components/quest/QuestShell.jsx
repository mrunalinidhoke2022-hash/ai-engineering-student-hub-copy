import React from "react";

// Immersive dark "learn to code" surface for the CodeQuest screens (Mimo-style).
// The .quest-app scope in index.css re-points the design tokens, so every child
// that already uses token classes (bg-card, text-foreground, bg-primary…) picks
// up the dark palette without any other change.
export default function QuestShell({ children, wide = false, className = "" }) {
  return (
    <div className="quest-app min-h-screen bg-background">
      <div className={`${wide ? "max-w-5xl" : "max-w-3xl"} mx-auto px-4 sm:px-6 py-10 ${className}`}>
        {children}
      </div>
    </div>
  );
}