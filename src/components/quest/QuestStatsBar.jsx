import React from "react";
import { Coins, Flame, Star, Trophy } from "lucide-react";
import StatTile from "@/components/quest/StatTile";
import XpBar from "@/components/quest/XpBar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function QuestStatsBar({ quest, level }) {
  const { t } = useLanguage();
  if (!quest || !level) return null;

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 shrink-0">
          <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gem to-primary text-white font-game font-extrabold text-xl flex items-center justify-center shadow-game">
            {level.level}
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{t("codequest.level")}</p>
            <p className="font-game font-extrabold text-lg leading-tight">★ {quest.streak_days ?? 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 flex-1 min-w-[240px]">
          <StatTile icon={Star} tone="xp" value={quest.xp} label={t("codequest.xp")} />
          <StatTile icon={Coins} tone="coin" value={quest.coins} label={t("codequest.coins")} />
          <StatTile icon={Flame} tone="streak" value={quest.streak_days} label={t("codequest.streak")} />
          <StatTile icon={Trophy} tone="success" value={quest.challenges_solved} label={t("codequest.solved")} />
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
          <span>{level.xpIntoLevel} / {level.xpForNextLevel} XP</span>
          <span>{t("codequest.nextLevel")}</span>
        </div>
        <XpBar value={level.progressPct} size="sm" className="mt-1.5" />
      </div>
    </div>
  );
}