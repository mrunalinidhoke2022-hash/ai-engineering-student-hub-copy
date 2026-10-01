import React from "react";
import { Lightbulb } from "lucide-react";

export default function GuideGuidance({ tips }) {
  return (
    <section className="bg-card border border-border rounded-lg p-6">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-primary" /> Guidance and common mistakes
      </h2>
      <ul className="mt-4 space-y-3">
        {tips.map((tip) => (
          <li key={tip} className="flex items-start gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
            <span className="text-sm text-muted-foreground">{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}