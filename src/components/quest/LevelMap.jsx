import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, Crown, Play } from "lucide-react";
import { isBossLevel } from "./questLabels";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PIPS = 10;

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
        const cleared = total > 0 && pct === 100;
        const started = done > 0 && !cleared;
        const filled = Math.round((pct / 100) * PIPS);
        const boss = isBossLevel(level);

        return (
          <li key={level.order}>
            <Link
              to={`/codequest/${slug}/${level.order}`}
              className={`group flex gap-4 rounded-2xl border-2 p-4 transition-all hover:-translate-y-0.5 ${
                cleared
                  ? "border-success/50 bg-success/5"
                  : boss
                    ? "border-destructive/40 bg-destructive/5"
                    : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <span
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-game font-extrabold text-lg shrink-0 text-white ${
                  cleared
                    ? "bg-gradient-to-br from-success to-xp"
                    : boss
                      ? "bg-gradient-to-br from-destructive to-streak"
                      : started
                        ? "bg-gradient-to-br from-primary to-gem"
                        : "bg-secondary text-muted-foreground"
                }`}
              >
                {boss ? <Crown className="w-6 h-6" /> : level.order}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-game font-extrabold text-lg">{level.title}</p>
                  {level.tier && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {level.tier}
                    </span>
                  )}
                  {cleared && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ★
                    </span>
                  )}
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
                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
                      <span>{t("codequest.doneCount", { done, total })}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="flex gap-1 mt-1.5">
                      {Array.from({ length: PIPS }).map((_, index) => (
                        <span
                          key={index}
                          className={`h-1.5 flex-1 rounded-full ${
                            index < filled ? (cleared ? "bg-success" : "bg-primary") : "bg-secondary"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">{t("codequest.levelEmpty")}</p>
                )}
              </div>

              <span className="self-center shrink-0 text-muted-foreground group-hover:text-primary">
                {cleared ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : started ? (
                  <Play className="w-5 h-5 text-primary" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}