import React, { useState } from "react";
import { CheckCircle2, ChevronDown, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import QuestTerminal from "@/components/quest/QuestTerminal";

const SECTIONS = [
  ["explanation", "Simple explanation"],
  ["real_world_example", "Real-world example"],
  ["try_it", "Try it yourself"],
  ["practice_question", "Practice question"],
  ["common_mistake", "Common mistake"],
  ["mini_challenge", "Mini challenge"],
];

export default function LessonCard({ lesson, completed, onComplete }) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  const complete = async () => {
    setSaving(true);
    try {
      await onComplete(lesson);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`bg-card border-2 rounded-2xl overflow-hidden ${completed ? "border-success/50 bg-success/5" : "border-border"}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-start justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-game font-extrabold text-lg">{lesson.title}</p>
            {completed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
                <CheckCircle2 className="w-3.5 h-3.5" /> {t("codequest.learned")}
              </span>
            )}
          </div>
          {lesson.summary && <p className="text-sm text-muted-foreground mt-0.5">{lesson.summary}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-game font-extrabold rounded-full bg-coin/15 text-coin px-2 py-0.5">+{lesson.xp_reward ?? 20} XP</span>
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
          {SECTIONS.map(([field, label]) =>
            lesson[field] ? (
              <div key={field}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="text-sm whitespace-pre-line mt-0.5">{lesson[field]}</p>
              </div>
            ) : null
          )}

          {lesson.code_example && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Code example</p>
              <QuestTerminal title={lesson.language_slug} prompt={null} className="mt-1">
                <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap">{lesson.code_example}</pre>
              </QuestTerminal>
            </div>
          )}

          {lesson.hint && (
            <div>
              <button type="button" onClick={() => setShowHint((value) => !value)} className="text-sm font-semibold text-primary inline-flex items-center gap-1">
                <Lightbulb className="w-4 h-4" /> {showHint ? "Hide hint" : "Show hint"}
              </button>
              {showHint && <p className="text-sm text-muted-foreground mt-1">{lesson.hint}</p>}
            </div>
          )}

          {lesson.solution_explanation && (
            <div>
              <button type="button" onClick={() => setShowSolution((value) => !value)} className="text-sm font-semibold text-primary">
                {showSolution ? "Hide solution explanation" : "Show solution explanation"}
              </button>
              {showSolution && <p className="text-sm text-muted-foreground mt-1">{lesson.solution_explanation}</p>}
            </div>
          )}

          <Button
            onClick={complete}
            disabled={completed || saving}
            className="gap-1.5 h-11 rounded-full font-game font-bold bg-gradient-to-r from-primary to-xp text-primary-foreground shadow-game active:scale-[.97] transition-transform"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            {completed ? t("codequest.learned") : t("codequest.markLearned")}
          </Button>
        </div>
      )}
    </div>
  );
}