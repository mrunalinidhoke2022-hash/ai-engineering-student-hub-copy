import React, { useState } from "react";
import { Hammer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

function List({ title, items }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="font-heading font-bold text-sm mb-2">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary">{item}</span>
        ))}
      </div>
    </div>
  );
}

function Text({ title, children }) {
  if (!children) return null;
  return (
    <div>
      <h3 className="font-heading font-bold text-sm mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

export default function ProjectBuilder() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  const generate = async () => {
    if (!idea.trim()) return;
    setLoading(true);
    setRoadmap(null);
    setSaved(false);
    try {
      const res = await base44.functions.invoke("projectRoadmap", { idea: idea.trim() });
      setRoadmap(res.data);
    } catch {
      toast({ description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveRoadmap = async () => {
    await base44.entities.ProjectRoadmap.create(roadmap);
    setSaved(true);
    toast({ description: "Roadmap saved to My Dashboard" });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-3xl flex items-center gap-2"><Hammer className="w-7 h-7 text-primary" /> Project Roadmap Generator</h1>
      <p className="text-muted-foreground mt-1">Describe your project idea and get a full, beginner-friendly plan: features, stack, database, steps and more.</p>

      <div className="mt-6 bg-card border border-border rounded-lg p-5">
        <label className="text-sm font-semibold">Project Idea</label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. AI-Based Student Attendance System"
          rows={3}
          className="w-full mt-2 border border-border rounded-md p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <Button onClick={generate} disabled={loading || !idea.trim()} className="mt-3 gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Generating Roadmap..." : "Generate Roadmap"}
        </Button>
      </div>

      {roadmap && (
        <div className="mt-6 bg-card border border-border rounded-lg p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-heading font-bold text-xl">{roadmap.idea}</h2>
            <Button size="sm" variant="outline" onClick={saveRoadmap} disabled={saved}>{saved ? "Saved" : "Save to Dashboard"}</Button>
          </div>
          <Text title="Problem Definition">{roadmap.problem_definition}</Text>
          <Text title="Target Users">{roadmap.target_users}</Text>
          <List title="Features" items={roadmap.features} />
          <List title="Technology Stack" items={roadmap.tech_stack} />
          <Text title="Architecture">{roadmap.architecture}</Text>
          <Text title="Database">{roadmap.database}</Text>
          <List title="AI Tools" items={roadmap.ai_tools} />
          <List title="APIs" items={roadmap.apis} />
          <div>
            <h3 className="font-heading font-bold text-sm mb-2">Development Steps</h3>
            <ol className="space-y-2">
              {(roadmap.development_steps || []).map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="w-5 h-5 rounded-full bg-accent text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <Text title="Testing">{roadmap.testing}</Text>
          <Text title="Deployment">{roadmap.deployment}</Text>
          <Text title="Documentation">{roadmap.documentation}</Text>
          <Text title="Presentation">{roadmap.presentation}</Text>
          <Text title="Future Scope">{roadmap.future_scope}</Text>
        </div>
      )}
    </div>
  );
}