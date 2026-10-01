import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import HackathonRoadmap from "@/components/hackathon/HackathonRoadmap";
import FilterChips from "@/components/common/FilterChips";
import EmptyState from "@/components/common/EmptyState";
import BookmarkButton from "@/components/tools/BookmarkButton";
import { base44 } from "@/api/base44Client";

const BASICS = [
  { q: "What is a hackathon?", a: "A time-boxed event (usually 12-48 hours) where teams build a working prototype around a theme or problem statement." },
  { q: "How hackathons work", a: "Teams register, receive problem statements or pick their own theme, build an MVP, then present it to judges for scoring." },
  { q: "Typical rules", a: "Team size limits (usually 2-4), a fixed build window, no pre-built projects, and mandatory use of provided APIs/themes in some events." },
  { q: "Team formation", a: "Aim for complementary roles: frontend, backend, AI/ML, design and presentation. 3-4 members is ideal for most hackathons." },
  { q: "Judging criteria", a: "Typically: innovation, technical execution, usability, presentation, and real-world impact." },
  { q: "MVP", a: "Minimum Viable Product — the smallest working version of your idea that demonstrates the core value, not every feature." },
  { q: "Demo", a: "A short, live walkthrough of your working product — practice it so it runs smoothly in under 3-5 minutes." },
  { q: "Pitch", a: "A concise story: the problem, your solution, how it works, and why it matters — usually under 3 minutes." },
];

const CATEGORIES = ["AI", "Agriculture", "Healthcare", "Education", "FinTech", "Cybersecurity", "Environment", "Smart City", "IoT", "Robotics", "Social Impact", "Web Development", "Mobile Development"];

export default function HackathonHub() {
  const [problems, setProblems] = useState([]);
  const [category, setCategory] = useState("");
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = category ? { category } : {};
    base44.entities.ProblemStatement.filter(query, { sort: "title", limit: 40 })
      .then((page) => setProblems(page.items))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-3xl">Hackathon Center</h1>
      <p className="text-muted-foreground mt-1">Everything you need from finding a hackathon to pitching your demo.</p>

      <section className="mt-8">
        <h2 className="font-heading font-bold text-xl mb-4">Hackathon Basics</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {BASICS.map((b) => (
            <div key={b.q} className="bg-card border border-border rounded-lg p-4">
              <p className="font-semibold text-sm">{b.q}</p>
              <p className="text-sm text-muted-foreground mt-1">{b.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 overflow-x-auto">
        <h2 className="font-heading font-bold text-xl mb-4">Hackathon Roadmap</h2>
        <HackathonRoadmap />
      </section>

      <section className="mt-10">
        <h2 className="font-heading font-bold text-xl mb-4">Problem Statement Explorer</h2>
        <FilterChips options={CATEGORIES} value={category} onChange={setCategory} allLabel="All Categories" />
        <div className="mt-5">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading problem statements...</p>
          ) : problems.length === 0 ? (
            <EmptyState title="No problem statements in this category yet" />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {problems.map((p) => (
                <button key={p.id} onClick={() => setActive(p)} className="text-left bg-card border border-border rounded-lg p-5 hover:border-primary/40">
                  <span className="text-xs font-semibold text-primary">{p.category} · {p.complexity}</span>
                  <h3 className="font-heading font-bold text-base mt-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.problem}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setActive(null)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-primary">{active.category} · {active.complexity}</span>
                <h2 className="font-heading font-bold text-xl mt-1">{active.title}</h2>
              </div>
              <button onClick={() => setActive(null)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <p><span className="font-semibold">Problem: </span><span className="text-muted-foreground">{active.problem}</span></p>
              {active.target_users && <p><span className="font-semibold">Target users: </span><span className="text-muted-foreground">{active.target_users}</span></p>}
              {active.existing_solutions && <p><span className="font-semibold">Existing solutions: </span><span className="text-muted-foreground">{active.existing_solutions}</span></p>}
              {active.research_resources && <p><span className="font-semibold">Research resources: </span><span className="text-muted-foreground">{active.research_resources}</span></p>}
              {active.possible_technologies?.length > 0 && (
                <div>
                  <span className="font-semibold">Possible technologies: </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {active.possible_technologies.map((t) => <span key={t} className="text-xs bg-secondary px-2 py-0.5 rounded-full">{t}</span>)}
                  </div>
                </div>
              )}
              {active.data_requirements && <p><span className="font-semibold">Data requirements: </span><span className="text-muted-foreground">{active.data_requirements}</span></p>}
              {active.suggested_next_steps && <p><span className="font-semibold">Suggested next steps: </span><span className="text-muted-foreground">{active.suggested_next_steps}</span></p>}
            </div>
            <div className="mt-5">
              <BookmarkButton itemType="problem_statement" itemId={active.id} itemName={active.title} folder="Hackathon" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}