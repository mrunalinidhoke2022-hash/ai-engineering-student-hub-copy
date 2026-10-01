import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import FilterChips from "@/components/common/FilterChips";
import EmptyState from "@/components/common/EmptyState";
import { base44 } from "@/api/base44Client";

const FOLDERS = ["My AI Tools", "Coding", "Hackathon", "Research", "Projects", "Design"];

const ITEM_ROUTE = {
  tool: (id, name) => null, // resolved via slug lookup fallback
  learning_path: () => "/learn",
  coding_problem: (id) => `/coding-practice/${id}`,
  prompt: () => "/prompts",
  problem_statement: () => "/hackathon-hub",
};

export default function Toolkit() {
  const [bookmarks, setBookmarks] = useState([]);
  const [folder, setFolder] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const query = folder ? { folder } : {};
    base44.entities.Bookmark.filter(query, { sort: "-created_date", limit: 100 })
      .then((page) => setBookmarks(page.items))
      .finally(() => setLoading(false));
  };

  useEffect(load, [folder]);

  const remove = async (id) => {
    await base44.entities.Bookmark.delete(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-3xl">My Toolkit</h1>
      <p className="text-muted-foreground mt-1">Everything you've saved — AI tools, prompts, coding problems, learning paths and hackathon resources.</p>

      <div className="mt-6">
        <FilterChips options={FOLDERS} value={folder} onChange={setFolder} allLabel="All Folders" />
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading your toolkit...</p>
        ) : bookmarks.length === 0 ? (
          <EmptyState title="Your toolkit is empty" description="Save tools, prompts and resources across the platform — they'll show up here." />
        ) : (
          <div className="space-y-2">
            {bookmarks.map((b) => {
              const route = b.item_type === "tool" ? `/ai-tools` : ITEM_ROUTE[b.item_type]?.(b.item_id);
              return (
                <div key={b.id} className="flex items-center justify-between gap-3 bg-card border border-border rounded-lg p-4">
                  <div>
                    <span className="text-[11px] font-semibold text-primary uppercase">{b.item_type.replace("_", " ")}</span>
                    <p className="font-semibold text-sm">{b.item_name}</p>
                    <span className="text-[11px] text-muted-foreground">{b.folder}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {route && <Link to={route} className="text-sm font-semibold text-primary">Open</Link>}
                    <button onClick={() => remove(b.id)} className="p-1.5 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}