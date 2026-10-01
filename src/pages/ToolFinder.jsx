import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import { base44 } from "@/api/base44Client";

const GOALS = [
  { label: "Build website", category: "Developer Tools" },
  { label: "Build mobile app", category: "Developer Tools" },
  { label: "Build AI project", category: "General AI" },
  { label: "Learn coding", category: "Coding" },
  { label: "Research", category: "Research" },
  { label: "Create PPT", category: "Presentations" },
  { label: "Design UI", category: "Design" },
  { label: "Generate images", category: "Image Generation" },
  { label: "Analyze data", category: "Data Science" },
  { label: "Participate in hackathon", category: "General AI" },
  { label: "Deploy project", category: "Cloud" },
  { label: "Create documentation", category: "Writing" },
];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

export default function ToolFinder() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState(null);
  const [level, setLevel] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const chooseGoal = (g) => {
    setGoal(g);
    setStep(2);
  };

  const chooseLevel = async (lvl) => {
    setLevel(lvl);
    setLoading(true);
    const page = await base44.entities.Tool.filter({ category: goal.category, level: lvl }, { limit: 6 });
    let items = page.items;
    if (items.length === 0) {
      const fallback = await base44.entities.Tool.filter({ category: goal.category }, { limit: 6 });
      items = fallback.items;
    }
    setResults(items);
    setLoading(false);
    setStep(3);
  };

  const reset = () => {
    setStep(1);
    setGoal(null);
    setLevel(null);
    setResults(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="font-heading font-extrabold text-3xl">What Do I Need?</h1>
      <p className="text-muted-foreground mt-1">Answer two quick questions and we'll recommend the right tools for you — with reasons, not just rankings.</p>

      {step === 1 && (
        <div className="mt-8">
          <h2 className="font-semibold mb-3">What are you trying to do?</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {GOALS.map((g) => (
              <button key={g.label} onClick={() => chooseGoal(g)} className="text-left border border-border rounded-lg p-4 hover:border-primary/40 bg-card">
                <p className="font-semibold text-sm">{g.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-2">Goal: <span className="font-semibold text-foreground">{goal.label}</span></p>
          <h2 className="font-semibold mb-3">What is your skill level?</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {LEVELS.map((lvl) => (
              <button key={lvl} onClick={() => chooseLevel(lvl)} className="border border-border rounded-lg p-5 text-center hover:border-primary/40 bg-card font-semibold">
                {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Recommended for <span className="font-semibold text-foreground">{goal.label}</span> · <span className="font-semibold text-foreground">{level}</span>
            </p>
            <button onClick={reset} className="text-sm font-semibold text-primary inline-flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Start over
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Finding recommendations...</p>
          ) : results?.length === 0 ? (
            <EmptyState title="No matching tools yet" description="Try a different goal or skill level." />
          ) : (
            <div className="space-y-4">
              {results.map((tool) => (
                <div key={tool.id} className="bg-card border border-border rounded-lg p-5">
                  <h3 className="font-heading font-bold text-lg">{tool.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1"><span className="font-semibold text-foreground">Why it's relevant: </span>{tool.why_use || tool.description}</p>
                  <p className="text-sm text-muted-foreground mt-1"><span className="font-semibold text-foreground">What it can do: </span>{tool.what_can_you_do || tool.description}</p>
                  <p className="text-sm text-muted-foreground mt-1"><span className="font-semibold text-foreground">How to start: </span>{tool.how_to_start || "See the tool's detail page for a step-by-step guide."}</p>
                  <div className="flex gap-2 mt-3">
                    <Link to={`/ai-tools/${tool.slug}`}>
                      <Button size="sm">Learning resource <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
                    </Link>
                    <a href={tool.official_url} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="gap-1.5">Open Website <ExternalLink className="w-3.5 h-3.5" /></Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}