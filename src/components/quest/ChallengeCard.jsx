import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Lightbulb } from "lucide-react";
import { CHALLENGE_TYPE_LABELS, DIFFICULTY_CLASSES } from "./questLabels";

export default function ChallengeCard({ challenge, attempt }) {
  const solved = attempt?.status === "solved";

  return (
    <Link
      to={`/codequest/challenge/${challenge.id}`}
      className={`block bg-card border rounded-lg p-4 hover:border-primary/40 transition-colors ${
        solved ? "border-success/40" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold">{challenge.title}</p>
            {solved && <CheckCircle2 className="w-4 h-4 text-success" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {CHALLENGE_TYPE_LABELS[challenge.type] || challenge.type}
            {challenge.topic ? ` · ${challenge.topic}` : ""}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${DIFFICULTY_CLASSES[challenge.difficulty] || "bg-secondary text-secondary-foreground"}`}>
            {challenge.difficulty}
          </span>
          <span className="text-xs font-semibold text-primary">+{challenge.xp_reward ?? 30} XP</span>
        </div>
      </div>

      {attempt && attempt.attempts > 0 && !solved && (
        <p className="text-xs text-muted-foreground mt-2">
          {attempt.attempts} attempt{attempt.attempts > 1 ? "s" : ""} so far
          {attempt.hints_used > 0 ? ` · ${attempt.hints_used} hint${attempt.hints_used > 1 ? "s" : ""} used` : ""}
        </p>
      )}
      {challenge.hints?.length > 0 && !solved && (
        <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
          <Lightbulb className="w-3.5 h-3.5" /> {challenge.hints.length} hints available
        </p>
      )}
    </Link>
  );
}