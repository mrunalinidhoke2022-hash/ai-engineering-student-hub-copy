import React from "react";

const STEPS = [
  "Find Hackathon", "Understand Rules", "Form Team", "Choose Problem", "Research", "Validate",
  "Select Technology", "Design", "Build MVP", "Test", "Deploy", "Prepare PPT", "Pitch", "Demo",
];

export default function HackathonRoadmap() {
  return (
    <div className="flex flex-wrap gap-2">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <div className="border border-border bg-card rounded-lg px-3 py-2 text-sm font-semibold flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
            {step}
          </div>
          {i < STEPS.length - 1 && <span className="text-muted-foreground hidden sm:inline">→</span>}
        </div>
      ))}
    </div>
  );
}