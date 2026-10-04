import React from "react";
import { BookOpen, Clock, Code2, Flame, Map as MapIcon, Play, Star, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatTile from "@/components/quest/StatTile";
import XpBar from "@/components/quest/XpBar";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { levelName } from "@/lib/questLevels";

export default function QuestHero({ quest, level, playerName, trackName, badges, languagesCount, daily, onStart, onRoadmap, onDaily, onAchievements }) {
  const { t } = useLanguage();
  const currentLevel = Number(level?.level) || 1;
  const xpInto = Number(level?.xpIntoLevel) || 0;
  const xpNeeded = Number(level?.xpForNextLevel) || 0;
  const away = Math.max(0, xpNeeded - xpInto);
  const started = Number(quest?.xp) > 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-border bg-gradient-to-br from-primary/10 via-card to-gem/10 p-5 sm:p-6 shadow-game">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-game font-extrabold text-3xl sm:text-4xl">{t("codequest.heroTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("codequest.heroTagline")}</p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card/80 px-3 py-2 animate-game-float motion-reduce:animate-none">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-coin to-streak text-white font-game font-extrabold text-xl flex items-center justify-center shrink-0 shadow-game-coin">
            {currentLevel}
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{t("codequest.player")}</p>
            <p className="font-game font-extrabold text-lg leading-tight">{playerName || levelName(currentLevel)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border-2 border-border bg-card/80 p-4">
        <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          <span>{t("codequest.level")} {currentLevel}</span>
          <span className="font-game text-sm normal-case tracking-normal text-foreground">{xpInto} / {xpNeeded} XP</span>
        </div>
        <XpBar value={level?.progressPct} size="lg" className="mt-2" />
        <p className="font-game font-extrabold text-sm mt-2">
          {started ? t("codequest.xpAway", { xp: away, level: currentLevel + 1 }) : t("codequest.noXpYet")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
        <StatTile icon={Flame} tone="streak" value={quest?.streak_days} label={t("codequest.dayStreak")} />
        <StatTile icon={BookOpen} tone="primary" value={quest?.lessons_completed} label={t("codequest.lessonsLearned")} />
        <StatTile icon={Trophy} tone="success" value={quest?.challenges_solved} label={t("codequest.solved")} />
        <StatTile icon={Star} tone="coin" value={badges} label={t("codequest.badgesEarned")} />
        <StatTile icon={Code2} tone="gem" value={languagesCount} label={t("codequest.languages")} />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        <Button
          onClick={onStart}
          className="h-11 rounded-full font-game text-base bg-gradient-to-r from-primary to-xp text-primary-foreground shadow-game active:scale-[.97] transition-transform"
        >
          <Play className="w-4 h-4" />
          {started ? t("codequest.continueCoding") : t("codequest.startCoding")}
        </Button>
        <Button variant="outline" onClick={onRoadmap} className="h-11 rounded-full font-game font-bold border-2">
          <MapIcon className="w-4 h-4" /> {t("codequest.viewRoadmap")}
        </Button>
        <Button variant="outline" onClick={onDaily} disabled={!daily} className="h-11 rounded-full font-game font-bold border-2">
          <Target className="w-4 h-4" /> {t("codequest.dailyChallenge")}
        </Button>
        <Button variant="outline" onClick={onAchievements} className="h-11 rounded-full font-game font-bold border-2">
          <Trophy className="w-4 h-4" /> {t("codequest.myAchievements")}
        </Button>
      </div>

      {(trackName || daily) && (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {trackName && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold">
              <Flame className="w-3.5 h-3.5 text-streak" /> {t("codequest.currentTrack", { language: trackName })}
            </span>
          )}
          {daily && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-xp" />
              {t("codequest.todaysQuest")}: {daily.title} · {daily.difficulty} · +{daily.xp_reward} XP
            </span>
          )}
        </div>
      )}
    </div>
  );
}