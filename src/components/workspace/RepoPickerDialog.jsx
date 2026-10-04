import React, { useEffect, useState } from "react";
import { Lock, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";

export default function RepoPickerDialog({ open, onOpenChange, onSaved }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [repos, setRepos] = useState([]);
  const [watched, setWatched] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    (async () => {
      setLoading(true);
      const [{ data }, page] = await Promise.all([
        base44.functions.invoke("githubCommits", { action: "repos" }),
        base44.entities.RepoWatch.list({ limit: 100 }),
      ]);
      if (!active) return;
      setRepos(data?.repos || []);
      setWatched(page.items);
      setLoading(false);
      if (data?.error) {
        toast({ description: "GitHub could not be reached right now.", variant: "destructive" });
      }
    })();
    return () => {
      active = false;
    };
  }, [open]);

  const add = async (repo) => {
    setBusy(repo.full_name);
    const created = await base44.entities.RepoWatch.create({
      full_name: repo.full_name,
      name: repo.name,
      owner: repo.owner,
      html_url: repo.html_url,
      private: !!repo.private,
      enabled: true,
      added_by: user?.full_name || "",
    });
    setWatched((list) => [...list, created]);
    setBusy("");
  };

  const remove = async (watch) => {
    setBusy(watch.full_name);
    await base44.entities.RepoWatch.delete(watch.id);
    setWatched((list) => list.filter((item) => item.id !== watch.id));
    setBusy("");
  };

  const close = (next) => {
    onOpenChange(next);
    if (!next) {
      setQuery("");
      onSaved?.();
    }
  };

  const term = query.trim().toLowerCase();
  const shown = term ? repos.filter((repo) => repo.full_name.toLowerCase().includes(term)) : repos;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Project repositories</DialogTitle>
          <DialogDescription>
            Pick the repositories whose commits should appear on the workspace dashboard. Up to 8 are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mt-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search your repositories..."
            className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        <div className="max-h-72 overflow-y-auto scroll-touch mt-3">
          {loading ? (
            <p className="text-sm text-muted-foreground py-4">Loading your repositories...</p>
          ) : shown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No repositories match that search.</p>
          ) : (
            <ul className="divide-y divide-border">
              {shown.map((repo) => {
                const watch = watched.find((item) => item.full_name === repo.full_name);
                return (
                  <li key={repo.full_name} className="flex items-center gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{repo.full_name}</p>
                      {repo.description && (
                        <p className="text-xs text-muted-foreground truncate">{repo.description}</p>
                      )}
                    </div>
                    {repo.private && <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                    <Button
                      size="sm"
                      variant={watch ? "outline" : "default"}
                      className="ml-auto shrink-0"
                      disabled={busy === repo.full_name}
                      onClick={() => (watch ? remove(watch) : add(repo))}
                    >
                      {busy === repo.full_name ? "Saving" : watch ? "Remove" : "Add"}
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          {watched.length} selected · commits are read with your own GitHub account, so other users never get access to it.
        </p>
      </DialogContent>
    </Dialog>
  );
}