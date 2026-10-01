import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, CheckCircle2, Hammer, TrendingUp } from "lucide-react";
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

  useEffect(() => {
    base44.entities.Bookmark.count({}).then(setBookmarkCount);
    base44.entities.Progress.count({ item_type: "coding_problem", status: "completed" }).then(setSolvedCount);
    base44.entities.ProjectRoadmap.list({ sort: "-created_date", limit: 5 }).then((p) => setRoadmaps(p.items));
    base44.entities.Bookmark.list({ sort: "-created_date", limit: 5 }).then((p) => setRecentBookmarks(p.items));
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
                  <span className="text-[11px] text-muted-foreground uppercase">{b.item_type.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}