import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Medal, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import EmptyState from "@/components/common/EmptyState";

const RANK_STYLES = {
  1: "bg-amber-100 text-amber-800",
  2: "bg-slate-200 text-slate-700",
  3: "bg-orange-100 text-orange-800",
};

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.functions
      .invoke("codingLeaderboard")
      .then((res) => setEntries(res.data?.entries || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-3xl flex items-center gap-2">
        <Medal className="w-7 h-7 text-primary" /> Leaderboard
      </h1>
      <p className="text-muted-foreground mt-1">The top 20 students by coding problems solved. Solve problems in the practice center to climb the ranks.</p>

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading leaderboard...
          </p>
        ) : entries.length === 0 ? (
          <EmptyState title="No solved problems yet" />
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card">
            {entries.map((entry) => (
              <div key={entry.user_id} className="flex items-center gap-3 p-4">
                <span className={`w-8 h-8 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${RANK_STYLES[entry.rank] || "bg-secondary text-muted-foreground"}`}>
                  {entry.rank}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{entry.name}</p>
                  <p className="text-xs text-muted-foreground">{entry.solved} problems solved</p>
                </div>
                {entry.language && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-accent text-accent-foreground shrink-0">{entry.language}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Want a spot on this list?{" "}
        <Link to="/coding-practice" className="text-primary font-medium hover:underline">
          Visit the Coding Practice Center
        </Link>
      </p>
    </div>
  );
}