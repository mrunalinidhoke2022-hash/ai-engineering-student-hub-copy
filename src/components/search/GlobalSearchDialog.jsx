import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SearchResultsList from "./SearchResultsList";
import { runSearch } from "@/lib/search";

// Search from anywhere in the app: the header button, or Ctrl/Cmd + K.
export default function GlobalSearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [state, setState] = useState({ loading: false, groups: [], total: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Search only while the dialog is open, only from two characters, and only once
  // typing pauses — one round of lookups per real search.
  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setState({ loading: false, groups: [], total: 0 });
      return;
    }
    let active = true;
    setState((previous) => ({ ...previous, loading: true }));
    const timer = setTimeout(() => {
      runSearch(trimmed).then((result) => {
        if (active) setState({ loading: false, ...result });
      });
    }, 500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, open]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const seeAll = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    close();
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Search everything"
        title="Search everything (Ctrl+K)"
      >
        <Search className="w-4 h-4" />
      </Button>

      <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : close())}>
        <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
          <DialogTitle className="sr-only">Search everything</DialogTitle>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              seeAll();
            }}
            className="flex items-center gap-2 border-b border-border px-4 py-3"
          >
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools, lessons, problems, prompts, pages..."
              className="flex-1 bg-transparent outline-none text-sm"
              aria-label="Search everything"
            />
            {state.loading ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : null}
          </form>

          <div className="max-h-[60vh] overflow-y-auto scroll-touch p-4">
            {query.trim().length < 2 ? (
              <p className="text-sm text-muted-foreground">
                Type at least two letters to search the whole platform — AI tools, coding problems, CodeQuest lessons and
                challenges, prompts, hackathon statements, guides and pages.
              </p>
            ) : state.total === 0 && !state.loading ? (
              <p className="text-sm text-muted-foreground">
                {state.failed
                  ? "Search is busy right now — please try again in a moment."
                  : `Nothing matched “${query.trim()}”. Try a language, topic or tool name.`}
              </p>
            ) : (
              <SearchResultsList groups={state.groups} onNavigate={close} maxPerGroup={4} />
            )}
          </div>

          {query.trim().length >= 2 && state.total > 0 ? (
            <button
              type="button"
              onClick={seeAll}
              className="border-t border-border px-4 py-3 text-sm font-semibold text-primary text-left hover:bg-accent"
            >
              See all {state.total} results for “{query.trim()}”
            </button>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}