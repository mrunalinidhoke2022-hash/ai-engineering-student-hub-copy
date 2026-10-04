import React from "react";
import { Coins, Flame, Star, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="text-center">
      <Icon className="w-4 h-4 text-primary mx-auto" />
      <p className="font-heading font-extrabold text-lg leading-tight">{value ?? 0}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function QuestStatsBar({ quest, level }) {
  const { t } = useLanguage();
  if (!quest || !level) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between gap-5 flex-wrap">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("codequest.level")}</p>
          <p className="font-heading font-extrabold text-3xl">{level.level}</p>
        </div>
        <div className="grid grid-cols-4 gap-5">
          <Stat icon={Star} value={quest.xp} label={t("codequest.xp")} />
          <Stat icon={Coins} value={quest.coins} label={t("codequest.coins")} />
          <Stat icon={Flame} value={quest.streak_days} label={t("codequest.streak")} />
          <Stat icon={Trophy} value={quest.challenges_solved} label={t("codequest.solved")} />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{level.xpIntoLevel} / {level.xpForNextLevel} XP</span>
          <span>{t("codequest.nextLevel")}</span>
        </div>
        <Progress value={level.progressPct} className="h-2 mt-1.5" />
      </div>
    </div>
  );
}