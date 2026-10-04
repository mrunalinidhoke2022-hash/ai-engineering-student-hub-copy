import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Loader2, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import SearchResultsList from "@/components/search/SearchResultsList";
import { PAGES, runSearch } from "@/lib/search";
import { QUICK_TOPICS } from "@/data/quickTopics";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const navigate = useNavigate();
  const [draft, setDraft] = useState(q);
  const [state, setState] = useState({ loading: false, groups: [], total: 0 });

  useEffect(() => {
    setDraft(q);
  }, [q]);

  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed) {
      setState({ loading: false, groups: [], total: 0 });
      return;
    }
    let active = true;
    setState((previous) => ({ ...previous, loading: true }));
    runSearch(trimmed).then((result) => {
      if (active) setState({ loading: false, ...result });
    });
    return () => {
      active = false;
    };
  }, [q]);

  const submit = (event) => {
    event.preventDefault();
    const trimmed = draft.trim();
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const searching = Boolean(q.trim());

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-2xl sm:text-3xl">Search everything</h1>
      <p className="text-sm text-muted-foreground mt-1">
        Tools, coding problems, CodeQuest lessons and challenges, prompts, guides, hackathon statements and every page.
      </p>

      <form onSubmit={submit} className="mt-5">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1.5">
          <SearchIcon className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Try “python loops”, “image generation”, “hackathon”..."
            className="flex-1 bg-transparent outline-none text-sm px-1 py-1.5"
            aria-label="Search everything"
          />
          <Button type="submit" size="sm" className="shrink-0">Search</Button>
        </div>
      </form>

      {searching && state.loading ? (
        <p className="text-sm text-muted-foreground mt-6 inline-flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Searching...
        </p>
      ) : null}

      {searching && !state.loading && state.total === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={`Nothing matched “${q.trim()}”`}
            description="Check the spelling, or jump to a section below and browse from there."
          />
        </div>
      ) : null}

      {searching && !state.loading && state.total > 0 ? (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">
            {state.total} result{state.total === 1 ? "" : "s"} for “{q.trim()}”
          </p>
          <SearchResultsList groups={state.groups} />
        </div>
      ) : null}

      {!searching ? (
        <div className="mt-10 space-y-8">
          <section>
            <h2 className="font-heading font-bold text-lg">Jump to any section</h2>
            <div className="mt-3 grid sm:grid-cols-2 gap-2">
              {PAGES.map((page) => (
                <Link
                  key={page.to}
                  to={page.to}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors"
                >
                  <span>
                    <span className="block text-sm font-semibold">{page.title}</span>
                    <span className="block text-xs text-muted-foreground line-clamp-1">{page.subtitle}</span>
                  </span>
                  <ArrowRight className="w-4 h-4 text-primary shrink-0" />
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-heading font-bold text-lg">Guides that are always ready</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {QUICK_TOPICS.map((topic) => (
                <Link
                  key={topic.slug}
                  to={`/guide/${topic.slug}`}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/40"
                >
                  {topic.chip}
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}