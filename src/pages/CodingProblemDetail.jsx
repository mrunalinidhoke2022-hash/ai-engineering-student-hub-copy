import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/common/EmptyState";
import { base44 } from "@/api/base44Client";

export default function CodingProblemDetail() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    setLoading(true);
    base44.entities.CodingProblem.get(id)
      .then(setProblem)
      .finally(() => setLoading(false));
    base44.entities.Progress.filter({ item_type: "coding_problem", item_id: id }, { limit: 1 }).then((page) => setProgress(page.items[0] || null));
  }, [id]);

  const markSolved = async () => {
    if (progress) {
      await base44.entities.Progress.update(progress.id, { status: "completed" });
      setProgress({ ...progress, status: "completed" });
    } else {
      const created = await base44.entities.Progress.create({ item_type: "coding_problem", item_id: id, item_name: problem.title, status: "completed" });
      setProgress(created);
    }
  };

  const practiceAgain = async () => {
    setShowSolution(false);
    setShowHint(false);
    if (progress) await base44.entities.Progress.update(progress.id, { status: "in_progress" });
  };

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 text-sm text-muted-foreground">Loading problem...</div>;
  if (!problem) return <EmptyState title="Problem not found" />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/coding-practice" className="text-sm font-semibold text-primary">← Back to Coding Practice</Link>

      <div className="flex items-start justify-between gap-4 mt-4 flex-wrap">
        <div>
          <h1 className="font-heading font-extrabold text-2xl">{problem.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{problem.language} · {problem.topic} · {problem.difficulty}</p>
        </div>
        {progress?.status === "completed" && (
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Solved
          </span>
        )}
      </div>

      <div className="bg-card border border-border rounded-lg p-6 mt-6 space-y-5">
        <div>
          <h2 className="font-heading font-bold text-lg mb-1">Problem</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{problem.problem}</p>
        </div>
        {problem.explanation && (
          <div>
            <h2 className="font-heading font-bold text-lg mb-1">Explanation</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line">{problem.explanation}</p>
          </div>
        )}
        {(problem.example_input || problem.example_output) && (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-secondary rounded-md p-3">
              <p className="text-xs font-semibold mb-1">Example Input</p>
              <p className="font-mono text-xs whitespace-pre-line">{problem.example_input}</p>
            </div>
            <div className="bg-secondary rounded-md p-3">
              <p className="text-xs font-semibold mb-1">Example Output</p>
              <p className="font-mono text-xs whitespace-pre-line">{problem.example_output}</p>
            </div>
          </div>
        )}

        {problem.hint && (
          <div>
            <button onClick={() => setShowHint(!showHint)} className="text-sm font-semibold text-primary inline-flex items-center gap-1">
              {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showHint ? "Hide Hint" : "Show Hint"}
            </button>
            {showHint && <p className="text-sm text-muted-foreground mt-2">{problem.hint}</p>}
          </div>
        )}

        <div>
          <button onClick={() => setShowSolution(!showSolution)} className="text-sm font-semibold text-primary inline-flex items-center gap-1">
            {showSolution ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {showSolution ? "Hide Solution" : "Show Solution"}
          </button>
          {showSolution && (
            <div className="mt-3 space-y-2">
              <pre className="font-mono text-xs bg-[#0F172A] text-slate-100 rounded-md p-3 overflow-x-auto">{problem.solution}</pre>
              {problem.solution_explanation && <p className="text-sm text-muted-foreground">{problem.solution_explanation}</p>}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button onClick={markSolved} disabled={progress?.status === "completed"} className="gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> {progress?.status === "completed" ? "Marked as Solved" : "Mark as Solved"}
          </Button>
          <Button variant="outline" onClick={practiceAgain}>Practice Again</Button>
        </div>
      </div>
    </div>
  );
}