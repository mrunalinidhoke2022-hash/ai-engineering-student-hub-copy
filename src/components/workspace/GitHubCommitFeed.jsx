import React, { useEffect, useState } from "react";
import moment from "moment";
import { GitBranch, GitCommit, RefreshCw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import RepoPickerDialog from "@/components/workspace/RepoPickerDialog";

const ERROR_TEXT = {
  not_connected: "GitHub isn't connected yet.",
  github_error: "GitHub could not be reached right now. Please try again in a moment.",
};

export default function GitHubCommitFeed() {
  const { user } = useAuth();
  const [commits, setCommits] = useState([]);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [managing, setManaging] = useState(false);
  const canManage = user?.role === "admin";

  const load = async (isRefresh) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const { data } = await base44.functions.invoke("githubCommits", { action: "commits" });
    setCommits(data?.commits || []);
    setRepos(data?.repos || []);
    setError(data?.error ? ERROR_TEXT[data.error] || "Couldn't load GitHub activity." : "");
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load(false);
  }, []);

  return (
    <section className="mt-8 bg-card border border-border rounded-lg p-5">
      <div className="flex items-center gap-2 flex-wrap">
        <GitBranch className="w-4 h-4 text-primary" />
        <h2 className="font-heading font-bold text-lg">Recent commits</h2>
        {repos.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {repos.length} {repos.length === 1 ? "repository" : "repositories"}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {canManage && (
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setManaging(true)}>
              <Settings2 className="w-3.5 h-3.5" /> Repositories
            </Button>
          )}
          <Button size="sm" variant="ghost" className="gap-1.5" disabled={refreshing} onClick={() => load(true)}>
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground mt-4">Loading GitHub activity...</p>
      ) : error ? (
        <p className="text-sm text-muted-foreground mt-4">{error}</p>
      ) : repos.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-4">
          No repositories picked yet{canManage ? " — choose the project repositories to follow." : "."}
        </p>
      ) : commits.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-4">No commits in the selected repositories yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {commits.map((commit) => (
            <li key={commit.id} className="py-3 first:pt-0 flex gap-3">
              {commit.avatar_url ? (
                <img src={commit.avatar_url} alt="" className="w-7 h-7 rounded-full mt-0.5" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center mt-0.5">
                  <GitCommit className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium break-words">{commit.message || "Commit"}</p>
                <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-muted-foreground">
                  <span>{commit.author_name}</span>
                  <span className="font-mono">{commit.short_sha}</span>
                  <a
                    href={commit.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {commit.repo}
                  </a>
                  <span className="ml-auto">{commit.date ? moment(commit.date).fromNow() : ""}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RepoPickerDialog
        open={managing}
        onOpenChange={setManaging}
        onSaved={() => load(true)}
      />
    </section>
  );
}