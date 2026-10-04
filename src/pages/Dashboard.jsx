import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Bookmark, CheckCircle2, Code2, Hammer, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";

function StatCard({ icon: Icon, label, value, to }) {
  return (
    <Link to={to} className="bg-card border border-border rounded-lg p-5 hover:border-primary/40 transition-colors">
      <Icon className="w-5 h-5 text-primary mb-2" />
      <p className="text-2xl font-heading font-extrabold">{value}</p>
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
        <Link to="/codequest" className="mt-6 flex items-center justify-between gap-4 bg-card border border-border rounded-lg p-5 hover:border-primary/40">
          <div>
            <p className="font-heading font-bold">CodeQuest</p>
            <p className="text-sm text-muted-foreground">
              Level {questLevel?.level ?? 1} · {quest.xp ?? 0} XP · {quest.streak_days ?? 0} day streak · {quest.challenges_solved ?? 0} challenges solved
            </p>
          </div>
          <span className="text-sm font-semibold text-primary shrink-0">Continue →</span>
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