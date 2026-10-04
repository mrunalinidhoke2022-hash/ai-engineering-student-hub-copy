import React from "react";
import { Link } from "react-router-dom";
import { Check, Crown, Play } from "lucide-react";
import { isBossLevel } from "./questLabels";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PIPS = 5;

// The roadmap is a path of nodes, the way a mobile learning app lays out a track:
// a vertical trail where the next level to play is lit up and cleared ones check off.
export default function LevelMap({ slug, levels, progressByLevel = {} }) {
  const { t } = useLanguage();
  if (!levels?.length) return null;

  const readStats = (order) => {
    const row = progressByLevel[order] || {};
    const total = (row.lessonsTotal || 0) + (row.challengesTotal || 0);
    const done = (row.lessonsDone || 0) + (row.challengesDone || 0);
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0, cleared: total > 0 && done >= total };
  };

  const upNext = levels.find((level) => !readStats(level.order).cleared);

  return (
    <ol className="flex flex-col items-center pt-2">
      {levels.map((level, index) => {
        const { total, done, pct, cleared } = readStats(level.order);
        const current = level.order === upNext?.order;
        const boss = isBossLevel(level);
        const filled = Math.round((pct / 100) * PIPS);

        const nodeClass = cleared
          ? "bg-gradient-to-br from-success to-xp text-white ring-4 ring-success/25"
          : current
            ? `${boss ? "bg-gradient-to-br from-destructive to-streak" : "bg-gradient-to-br from-primary to-xp"} text-white ring-4 ring-primary/30 shadow-game-lg animate-game-float motion-reduce:animate-none`
            : "bg-secondary text-muted-foreground border-2 border-border";

        return (
          <li key={level.order} className="flex flex-col items-center w-full">
            <Link
              to={`/codequest/${slug}/${level.order}`}
              className="group flex flex-col items-center text-center max-w-[18rem] px-2"
            >
              <span
                className={`relative w-16 h-16 rounded-full flex items-center justify-center font-game font-extrabold text-2xl transition-transform group-hover:scale-105 group-active:scale-95 ${nodeClass}`}
              >
                {cleared ? <Check className="w-7 h-7" strokeWidth={3} /> : boss ? <Crown className="w-7 h-7" /> : level.order}
                {cleared && (
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-card border-2 border-success text-success flex items-center justify-center text-[10px] font-bold">
                    ★
                  </span>
                )}
              </span>

              <p className="font-game font-extrabold text-base mt-3">{level.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {level.tier}
                {total > 0 ? ` · ${t("codequest.doneCount", { done, total })}` : ` · ${t("codequest.levelEmpty")}`}
              </p>

              {total > 0 && (
                <span className="flex gap-1 mt-2 w-28">
                  {Array.from({ length: PIPS }).map((_, pip) => (
                    <span
                      key={pip}
                      className={`h-1.5 flex-1 rounded-full ${
                        pip < filled ? (cleared ? "bg-success" : "bg-primary") : "bg-secondary"
                      }`}
                    />
                  ))}
                </span>
              )}

              {current && (
                <>
                  <span className="inline-flex items-center gap-1.5 mt-3 rounded-full px-3.5 py-1.5 bg-gradient-to-r from-primary to-xp text-primary-foreground text-xs font-game font-extrabold shadow-game">
                    <Play className="w-3.5 h-3.5" />
                    {done > 0 ? t("codequest.continueCoding") : t("codequest.startCoding")}
                  </span>
                  {level.focus && <p className="text-xs text-muted-foreground mt-2">{level.focus}</p>}
                </>
              )}
            </Link>

            {index < levels.length - 1 && (
              <span className={`w-1.5 h-10 rounded-full my-2 ${cleared ? "bg-success/60" : "bg-secondary"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}