import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Flame } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { isBossLevel } from "./questLabels";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LevelMap({ slug, levels, progressByLevel = {} }) {
  const { t } = useLanguage();
  if (!levels?.length) return null;

  return (
    <ol className="space-y-3">
      {levels.map((level) => {
        const stats = progressByLevel[level.order] || {};
        const total = (stats.lessonsTotal || 0) + (stats.challengesTotal || 0);
        const done = (stats.lessonsDone || 0) + (stats.challengesDone || 0);
        const pct = total ? Math.round((done / total) * 100) : 0;
        const boss = isBossLevel(level);

        return (
          <li key={level.order}>
            <Link
              to={`/codequest/${slug}/${level.order}`}
              className="flex gap-4 bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors"
            >
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-heading font-extrabold shrink-0 ${
                  boss
                    ? "bg-destructive/10 text-destructive"
                    : pct === 100
                      ? "bg-success/10 text-success"
                      : "bg-accent text-accent-foreground"
                }`}
              >
                {boss ? <Flame className="w-5 h-5" /> : level.order}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{level.title}</p>
                  {level.tier && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {level.tier}
                    </span>
                  )}
                  {pct === 100 && <CheckCircle2 className="w-4 h-4 text-success" />}
                </div>
                {level.focus && <p className="text-sm text-muted-foreground mt-0.5">{level.focus}</p>}
                {level.topics?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {level.topics.map((topic, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}

                {total > 0 ? (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t("codequest.doneCount", { done, total })}</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5 mt-1" />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">{t("codequest.levelEmpty")}</p>
                )}
              </div>

              <ChevronRight className="w-5 h-5 text-muted-foreground self-center shrink-0" />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}