import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function Block({ title, children }) {
  if (!children) return null;
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="text-sm mt-1 whitespace-pre-line">{children}</div>
    </div>
  );
}

export default function TeamRoadmapPanel({ team, isMember, myRoadmaps, onShare, onSaveFeatures }) {
  const [selected, setSelected] = useState("");
  const [sharing, setSharing] = useState(false);
  const [feature, setFeature] = useState("");
  const [savingFeature, setSavingFeature] = useState(false);
  const hasRoadmap = !!team.roadmap_title || !!team.roadmap_problem;
  const features = team.roadmap_features || [];
  const tech = team.roadmap_tech || [];
  const steps = team.roadmap_steps || [];

  const share = async () => {
    if (!selected) return;
    setSharing(true);
    await onShare(selected);
    setSharing(false);
  };

  const saveFeatures = async (next) => {
    setSavingFeature(true);
    await onSaveFeatures(next);
    setSavingFeature(false);
  };

  const addFeature = async () => {
    const text = feature.trim();
    if (!text) return;
    await saveFeatures([...features, text]);
    setFeature("");
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2">
        <Compass className="w-4 h-4 text-primary" />
        <h3 className="font-heading font-bold text-sm">Shared project roadmap</h3>
      </div>

      {hasRoadmap ? (
        <div className="mt-3">
          <p className="font-heading font-bold text-lg">{team.roadmap_title || "Team project"}</p>
          {team.roadmap_shared_by && (
            <p className="text-xs text-muted-foreground mt-0.5">Shared by {team.roadmap_shared_by}</p>
          )}

          <Block title="Problem">{team.roadmap_problem}</Block>

          {features.length > 0 && (
            <Block title="Features">
              <ul className="list-disc pl-5 space-y-1">
                {features.map((item, index) => (
                  <li key={`${item}-${index}`} className="flex items-start gap-2">
                    <span className="flex-1">{item}</span>
                    {isMember && (
                      <button
                        type="button"
                        onClick={() => saveFeatures(features.filter((_, position) => position !== index))}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        aria-label={`Remove ${item}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {tech.length > 0 && (
            <Block title="Tech stack">
              <div className="flex flex-wrap gap-2">
                {tech.map((item, index) => (
                  <span key={`${item}-${index}`} className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary">
                    {item}
                  </span>
                ))}
              </div>
            </Block>
          )}

          {steps.length > 0 && (
            <Block title="Development steps">
              <ol className="list-decimal pl-5 space-y-1">
                {steps.map((step, index) => (
                  <li key={`${step}-${index}`}>{step}</li>
                ))}
              </ol>
            </Block>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-3">
          No roadmap shared yet.{" "}
          {isMember
            ? "Add features below to start a team roadmap, or share one of your generated roadmaps."
            : "Join the team to share a roadmap."}
        </p>
      )}

      {isMember && (
        <div className="border-t border-border mt-5 pt-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFeature()}
              placeholder="Add a feature to the team roadmap"
              className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button size="sm" onClick={addFeature} disabled={!feature.trim() || savingFeature} className="shrink-0">
              {savingFeature ? "Saving..." : "Add feature"}
            </Button>
          </div>

          {myRoadmaps.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Choose one of your roadmaps..." />
                </SelectTrigger>
                <SelectContent>
                  {myRoadmaps.map((roadmap) => (
                    <SelectItem key={roadmap.id} value={roadmap.id}>
                      {roadmap.idea}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={share} disabled={!selected || sharing} className="shrink-0">
                {sharing ? "Sharing..." : hasRoadmap ? "Replace roadmap" : "Share with team"}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              You don't have a roadmap yet.{" "}
              <Link to="/project-builder" className="text-primary font-semibold">
                Generate one in Project Builder
              </Link>{" "}
              and come back to share it.
            </p>
          )}
        </div>
      )}
    </div>
  );
}