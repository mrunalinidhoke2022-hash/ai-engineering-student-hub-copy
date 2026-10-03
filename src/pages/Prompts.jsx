import React, { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import FilterChips from "@/components/common/FilterChips";
import EmptyState from "@/components/common/EmptyState";
import BookmarkButton from "@/components/tools/BookmarkButton";
import { base44 } from "@/api/base44Client";
import useSavedBookmarks from "@/hooks/useSavedBookmarks";
import PullToRefresh from "@/components/common/PullToRefresh";

const CATEGORIES = ["Coding", "Debugging", "Research", "Project Ideas", "Documentation", "PPT", "UI/UX", "Resume", "Interview", "Hackathon", "Learning", "SQL", "GitHub", "Testing"];

export default function Prompts() {
  const [prompts, setPrompts] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const { isSaved, toggle } = useSavedBookmarks("prompt", prompts, "Research");

  const load = () => {
    setLoading(true);
    const query = category ? { category } : {};
    return base44.entities.Prompt.filter(query, { sort: "title", limit: 60 })
      .then((page) => setPrompts(page.items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [category]);

  const copy = (p) => {
    navigator.clipboard.writeText(p.prompt_text);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <PullToRefresh onRefresh={load} />
      <h1 className="font-heading font-extrabold text-3xl">AI Prompt Library</h1>
      <p className="text-muted-foreground mt-1">Ready-to-use prompts for coding, research, hackathons, PPTs and more.</p>

      <div className="mt-6">
        <FilterChips options={CATEGORIES} value={category} onChange={setCategory} allLabel="All Categories" />
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading prompts...</p>
        ) : prompts.length === 0 ? (
          <EmptyState title="No prompts in this category yet" />
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {prompts.map((p) => (
              <div key={p.id} className="bg-card border border-border rounded-lg p-5 flex flex-col gap-3">
                <div>
                  <span className="text-xs font-semibold text-primary">{p.category}</span>
                  <h3 className="font-heading font-bold text-base mt-0.5">{p.title}</h3>
                </div>
                <p className="font-mono text-xs bg-secondary rounded-md p-3 whitespace-pre-line">{p.prompt_text}</p>
                <div className="flex gap-2">
                  <button onClick={() => copy(p)} className="text-sm font-semibold text-primary inline-flex items-center gap-1.5">
                    {copiedId === p.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copiedId === p.id ? "Copied" : "Copy Prompt"}
                  </button>
                  <BookmarkButton
                    itemType="prompt"
                    itemId={p.id}
                    itemName={p.title}
                    folder="Research"
                    saved={isSaved(p.id)}
                    onToggle={toggle}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}