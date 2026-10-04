import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Lightbulb, Play } from "lucide-react";
import { CHALLENGE_TYPE_LABELS, DIFFICULTY_CLASSES } from "./questLabels";

export default function ChallengeCard({ challenge, attempt }) {
  const solved = attempt?.status === "solved";

  return (
    <Link
      to={`/codequest/challenge/${challenge.id}`}
      className={`group flex items-start gap-3 rounded-2xl border-2 p-4 transition-all hover:-translate-y-0.5 ${
        solved ? "border-success/50 bg-success/5" : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <span
        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white ${
          solved ? "bg-gradient-to-br from-success to-xp" : "bg-gradient-to-br from-primary to-gem"
        }`}
      >
        {solved ? <CheckCircle2 className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-game font-extrabold text-lg">{challenge.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {CHALLENGE_TYPE_LABELS[challenge.type] || challenge.type}
              {challenge.topic ? ` · ${challenge.topic}` : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${DIFFICULTY_CLASSES[challenge.difficulty] || "bg-secondary text-secondary-foreground"}`}>
              {challenge.difficulty}
            </span>
            <span className="text-xs font-game font-extrabold px-2 py-0.5 rounded-full bg-coin/15 text-coin">
              +{challenge.xp_reward ?? 30} XP
            </span>
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
            <Lightbulb className="w-3.5 h-3.5 text-warning" /> {challenge.hints.length} hints available
          </p>
        )}
      </div>

      <ChevronRight className="w-5 h-5 text-muted-foreground self-center shrink-0 group-hover:text-primary" />
    </Link>
  );
}