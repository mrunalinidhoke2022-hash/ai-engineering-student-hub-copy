import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from "@/api/base44Client";

const MIN_CODE = 20;

function ReviewResult({ review }) {
  if (!review.has_issues) {
    return (
      <div className="mt-5 border border-emerald-200 bg-emerald-50 rounded-lg p-4">
        <p className="font-semibold text-sm text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> No issues found
        </p>
        {review.summary && <p className="text-sm text-emerald-800/80 mt-1">{review.summary}</p>}
      </div>
    );
  }

  return (
    <div className="mt-5 border border-border rounded-lg p-4">
      <p className="font-semibold text-sm flex items-center gap-1.5 text-warning">
        <AlertTriangle className="w-4 h-4" /> {review.issues.length} thing{review.issues.length > 1 ? "s" : ""} to fix
      </p>
      {review.summary && <p className="text-sm text-muted-foreground mt-1">{review.summary}</p>}

      <ol className="mt-3 space-y-2">
        {review.issues.map((issue, i) => (
          <li key={i} className="text-sm">
            <span className="font-semibold">{i + 1}. {issue.title}</span>
            <p className="text-muted-foreground">{issue.detail}</p>
          </li>
        ))}
      </ol>

      {review.learning_paths?.length > 0 && (
        <div className="mt-4 border-t border-border pt-3">
          <p className="text-sm font-semibold">Practise this next</p>
          <ul className="mt-2 space-y-1.5">
            {review.learning_paths.map((path, i) => (
              <li key={i} className="text-sm">
                <Link to="/learn" className="font-semibold text-primary hover:underline">{path.title}</Link>
                {path.step && <span className="text-muted-foreground"> — start with “{path.step}”</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4">
        Saved to your notifications and bookmarked in your toolkit so you can come back to it.
      </p>
    </div>
  );
}

export default function CodeReviewPanel({ problem }) {
  const [code, setCode] = useState("");
  const [review, setReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    base44.entities.CodeReview.filter({ problem_id: problem.id }, { sort: "-created_date", limit: 1 })
      .then((page) => setReview(page.items[0] || null));
  }, [problem.id]);

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await base44.functions.invoke("aiMentor", {
        mode: "code_review",
        problem_id: problem.id,
        code
      });
      setReview(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || "We couldn't review your code just now. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const trimmedLength = code.trim().length;

  return (
    <div className="bg-card border border-border rounded-lg p-6 mt-6">
      <h2 className="font-heading font-bold text-lg flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" /> AI Code Review
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Paste your {problem.language} solution and the AI mentor will check it for real problems and point you at what to practise next.
      </p>

      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={4000}
        rows={8}
        placeholder="Paste your code here..."
        className="font-mono text-xs mt-3"
      />

      <div className="flex items-center gap-3 mt-3">
        <Button onClick={submit} disabled={submitting || trimmedLength < MIN_CODE} className="gap-1.5">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {submitting ? "Reviewing..." : "Review my code"}
        </Button>
        {trimmedLength > 0 && trimmedLength < MIN_CODE && (
          <span className="text-xs text-muted-foreground">Keep going — paste a bit more code.</span>
        )}
      </div>

      {error && <p className="text-sm text-destructive mt-3">{error}</p>}
      {review && <ReviewResult review={review} />}
    </div>
  );
}