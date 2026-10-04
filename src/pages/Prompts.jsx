import React, { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import FilterChips from "@/components/common/FilterChips";
import EmptyState from "@/components/common/EmptyState";
import BookmarkButton from "@/components/tools/BookmarkButton";
import { base44 } from "@/api/base44Client";
import useSavedBookmarks from "@/hooks/useSavedBookmarks";
import PullToRefresh from "@/components/common/PullToRefresh";

const CATEGORIES = ["Coding", "Debugging", "Research", "Project Ideas", "Documentation", "PPT", "UI/UX", "Resume", "Interview", "Hackathon", "Learning", "SQL", "GitHub", "Testing"];

const PAGE_SIZE = 60;

export default function Prompts() {
  const [prompts, setPrompts] = useState([]);
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const { isSaved, toggle } = useSavedBookmarks("prompt", prompts, "Research");

  const load = () => {
    setLoading(true);
    const query = category ? { category } : {};
    return Promise.all([
      base44.entities.Prompt.filter(query, { sort: "title", limit: PAGE_SIZE }),
      base44.entities.Prompt.count(query),
    ])
      .then(([page, count]) => {
        setPrompts(page.items);
        setCursor(page.next_cursor);
        setHasMore(Boolean(page.has_more));
        setTotal(count);
      })
      .finally(() => setLoading(false));
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const query = category ? { category } : {};
    return base44.entities.Prompt.filter(query, { sort: "title", limit: PAGE_SIZE, cursor })
      .then((page) => {
        setPrompts((prev) => [...prev, ...page.items]);
        setCursor(page.next_cursor);
        setHasMore(Boolean(page.has_more));
      })
      .finally(() => setLoadingMore(false));
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
          <>
            <p className="text-xs text-muted-foreground mb-3">
              Showing {prompts.length} of {total} prompts
            </p>
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
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading more..." : "Load more prompts"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}