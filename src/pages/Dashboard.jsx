import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Bookmark, CheckCircle2, Code2, Flame, Hammer, Play, Star, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import StatTile from "@/components/quest/StatTile";
import XpBar from "@/components/quest/XpBar";
import { levelName } from "@/lib/questLevels";

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border-2 border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-game"
    >
      <span className="inline-flex w-10 h-10 items-center justify-center rounded-2xl bg-primary/15 text-primary mb-2">
        <Icon className="w-5 h-5" />
      </span>
      <p className="text-2xl font-game font-extrabold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [roadmaps, setRoadmaps] = useState([]);
  const [recentBookmarks, setRecentBookmarks] = useState([]);
  const [quest, setQuest] = useState(null);
  const [questLevel, setQuestLevel] = useState(null);

  useEffect(() => {
    base44.entities.Bookmark.count({}).then(setBookmarkCount);
    base44.entities.Progress.count({ item_type: "coding_problem", status: "completed" }).then(setSolvedCount);
    base44.entities.ProjectRoadmap.list({ sort: "-created_date", limit: 5 }).then((p) => setRoadmaps(p.items));
    base44.entities.Bookmark.list({ sort: "-created_date", limit: 5 }).then((p) => setRecentBookmarks(p.items));
    base44.functions
      .invoke("questPlay", { action: "stats" })
      .then((response) => {
        setQuest(response.data?.quest || null);
        setQuestLevel(response.data?.level || null);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-3xl">My Dashboard</h1>
      <p className="text-muted-foreground mt-1">Welcome back{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}. Here's where you left off.</p>

      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        <StatCard icon={Bookmark} label="Saved Resources" value={bookmarkCount} to="/toolkit" />
        <StatCard icon={CheckCircle2} label="Problems Solved" value={solvedCount} to="/coding-practice" />
        <StatCard icon={Hammer} label="Project Roadmaps" value={roadmaps.length} to="/project-builder" />
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        <Link to="/learn"><Button variant="outline" size="sm" className="gap-1.5"><BookOpen className="w-4 h-4" /> Continue learning</Button></Link>
        <Link to="/codequest"><Button variant="outline" size="sm" className="gap-1.5"><Code2 className="w-4 h-4" /> Continue coding</Button></Link>
        <Link to="/project-builder"><Button variant="outline" size="sm" className="gap-1.5"><Hammer className="w-4 h-4" /> Build a project</Button></Link>
        <Link to="/hackathon-hub"><Button variant="outline" size="sm" className="gap-1.5"><Trophy className="w-4 h-4" /> Explore hackathons</Button></Link>
      </div>

      {quest && (
        <Link
          to="/codequest"
          className="mt-6 block rounded-3xl border-2 border-border bg-gradient-to-br from-primary/10 via-card to-xp/10 p-5 transition-colors hover:border-primary/60"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-coin to-streak text-white font-game font-extrabold text-2xl flex items-center justify-center shrink-0 shadow-game-coin">
              {questLevel?.level ?? 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-game font-extrabold text-lg leading-tight">
                CodeQuest · {levelName(questLevel?.level ?? 1)}
              </p>
              <XpBar value={questLevel?.progressPct} size="sm" className="mt-2" />
              <p className="text-xs text-muted-foreground mt-1.5">
                {questLevel?.xpIntoLevel ?? 0} / {questLevel?.xpForNextLevel ?? 0} XP · {quest.xp ?? 0} XP total
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-xp text-primary-foreground font-game font-bold px-4 py-2 shrink-0">
              <Play className="w-4 h-4" /> Continue
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <StatTile icon={Star} tone="xp" value={quest.xp ?? 0} label="XP" />
            <StatTile icon={Flame} tone="streak" value={quest.streak_days ?? 0} label="day streak" />
            <StatTile icon={Trophy} tone="success" value={quest.challenges_solved ?? 0} label="challenges solved" />
          </div>
        </Link>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2"><Hammer className="w-4 h-4 text-primary" /> My Projects</h2>
          {roadmaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No project roadmaps yet. <Link to="/project-builder" className="text-primary font-semibold">Generate your first one →</Link></p>
          ) : (
            <div className="space-y-2">
              {roadmaps.map((r) => (
                <div key={r.id} className="border border-border rounded-md p-3">
                  <p className="font-semibold text-sm">{r.idea}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{r.problem_definition}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Recent Activity</h2>
          {recentBookmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing saved yet. <Link to="/ai-tools" className="text-primary font-semibold">Explore AI Tools →</Link></p>
          ) : (
            <div className="space-y-2">
              {recentBookmarks.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-sm border border-border rounded-md p-3">
                  <span className="font-medium">{b.item_name}</span>
                  <span className="text-xs text-muted-foreground uppercase">{b.item_type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}