import React from "react";
import { Compass } from "lucide-react";

export default function GuideRoadmap({ steps }) {
  return (
    <section className="bg-card border border-border rounded-lg p-6">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2">
        <Compass className="w-5 h-5 text-primary" /> Step-by-step roadmap
      </h2>
      <ol className="mt-5 space-y-5">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {index + 1}
            </span>
            <div>
              <p className="font-semibold text-sm">{step.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}