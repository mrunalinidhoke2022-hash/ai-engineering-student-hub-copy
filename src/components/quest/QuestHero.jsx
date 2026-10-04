import React from "react";
import { Clock, Flame, Map as MapIcon, Rocket, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { levelName } from "@/lib/questLevels";

function Pill({ value, label }) {
  return (
    <div className="text-center">
      <p className="font-heading font-extrabold text-lg leading-tight">{value ?? 0}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function QuestHero({ quest, level, trackName, badges, languagesCount, daily, onStart, onRoadmap, onDaily, onAchievements }) {
  const { t } = useLanguage();
  const currentLevel = Number(level?.level) || 1;
  const xpInto = Number(level?.xpIntoLevel) || 0;
  const xpNeeded = Number(level?.xpForNextLevel) || 0;
  const away = Math.max(0, xpNeeded - xpInto);
  const started = Number(quest?.xp) > 0;

  return (
    <div className="bg-card border border-border rounded-xl p-5 sm:p-6">
      <h1 className="font-heading font-extrabold text-3xl sm:text-4xl">{t("codequest.heroTitle")}</h1>
      <p className="text-muted-foreground mt-1">{t("codequest.heroTagline")}</p>

      <div className="mt-5 rounded-lg bg-secondary/60 border border-border p-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("codequest.level")} {currentLevel}
            </p>
            <p className="font-heading font-bold text-xl">{levelName(currentLevel)}</p>
          </div>
          <p className="text-sm text-muted-foreground">{xpInto} / {xpNeeded} XP</p>
        </div>
        <div className="h-2.5 rounded-full bg-background mt-3 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${Number(level?.progressPct) || 0}%` }}
          />
        </div>
        <p className="text-sm font-semibold mt-2">
          {started ? t("codequest.xpAway", { xp: away, level: currentLevel + 1 }) : t("codequest.noXpYet")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-5">
        <Pill value={quest?.streak_days} label={t("codequest.dayStreak")} />
        <Pill value={quest?.lessons_completed} label={t("codequest.lessonsLearned")} />
        <Pill value={quest?.challenges_solved} label={t("codequest.solved")} />
        <Pill value={badges} label={t("codequest.badgesEarned")} />
        <Pill value={languagesCount} label={t("codequest.languages")} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        <Button onClick={onStart}>
          <Rocket className="w-4 h-4" />
          {started ? t("codequest.continueCoding") : t("codequest.startCoding")}
        </Button>
        <Button variant="outline" onClick={onRoadmap}>
          <MapIcon className="w-4 h-4" /> {t("codequest.viewRoadmap")}
        </Button>
        <Button variant="outline" onClick={onDaily} disabled={!daily}>
          <Target className="w-4 h-4" /> {t("codequest.dailyChallenge")}
        </Button>
        <Button variant="outline" onClick={onAchievements}>
          <Trophy className="w-4 h-4" /> {t("codequest.myAchievements")}
        </Button>
      </div>

      {(trackName || daily) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
          {trackName && (
            <span className="inline-flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-primary" /> {t("codequest.currentTrack", { language: trackName })}
            </span>
          )}
          {daily && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {t("codequest.todaysQuest")}: {daily.title} · {daily.difficulty} · +{daily.xp_reward} XP
            </span>
          )}
        </div>
      )}
    </div>
  );
}