import React from "react";

// CodeQuest page surface. It uses the app's normal light theme so every line of
// text stays clear, and adds a soft game-tinted wash behind the level content.
export default function QuestShell({ children, wide = false, className = "" }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-b from-primary/5 via-background to-background">
        <div className={`${wide ? "max-w-5xl" : "max-w-3xl"} mx-auto px-4 sm:px-6 py-10 ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
}