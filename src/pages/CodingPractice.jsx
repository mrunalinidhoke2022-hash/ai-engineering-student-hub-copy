import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import FilterChips from "@/components/common/FilterChips";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import PullToRefresh from "@/components/common/PullToRefresh";

const LANGUAGES = ["C", "C++", "Java", "Python", "JavaScript", "HTML", "CSS", "SQL"];
const DIFFICULTIES = ["Beginner", "Easy", "Medium", "Hard"];

const DIFFICULTY_COLORS = {
  Beginner: "bg-emerald-50 text-emerald-700",
  Easy: "bg-sky-50 text-sky-700",
  Medium: "bg-amber-50 text-amber-700",
  Hard: "bg-rose-50 text-rose-700",
};

export default function CodingPractice() {
  const [problems, setProblems] = useState([]);
  const [language, setLanguage] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [loading, setLoading] = useState(true);
  const [solved, setSolved] = useState(new Set());

  const load = () => {
    setLoading(true);
    const query = {};
    if (language) query.language = language;
    if (difficulty) query.difficulty = difficulty;
    const problemsRequest = base44.entities.CodingProblem.filter(query, { sort: "title", limit: 60 })
      .then((page) => setProblems(page.items))
      .finally(() => setLoading(false));
    const progressRequest = base44.entities.Progress.filter({ item_type: "coding_problem", status: "completed" }, { limit: 200 }).then((page) =>
      setSolved(new Set(page.items.map((p) => p.item_id)))
    );
    return Promise.all([problemsRequest, progressRequest]);
  };

  useEffect(() => {
    load();
  }, [language, difficulty]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <PullToRefresh onRefresh={load} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading font-extrabold text-3xl">Coding Practice Center</h1>
          <p className="text-muted-foreground mt-1">Practice real problems across languages and difficulty levels. Track what you've solved.</p>
        </div>
        <Link to="/leaderboard" className="shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Trophy className="w-4 h-4" /> Leaderboard
          </Button>
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        <FilterChips options={LANGUAGES} value={language} onChange={setLanguage} allLabel="All Languages" />
        <FilterChips options={DIFFICULTIES} value={difficulty} onChange={setDifficulty} allLabel="All Difficulties" />
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading problems...</p>
        ) : problems.length === 0 ? (
          <EmptyState title="No problems match these filters" />
        ) : (
          <div className="border border-border rounded-lg divide-y divide-border overflow-hidden bg-card">
            {problems.map((p) => (
              <Link key={p.id} to={`/coding-practice/${p.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-secondary/50">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.language} · {p.topic}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {solved.has(p.id) && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Solved</span>}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_COLORS[p.difficulty]}`}>{p.difficulty}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}