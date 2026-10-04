import React from "react";
import { ChevronDown, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import XpBar from "@/components/quest/XpBar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// A track is playable only once it has a published level map; everything else is a roadmap preview.
export const isTrackReady = (language) => language?.curriculum_status === "ready" && (language?.levels?.length || 0) > 0;

const DIFFICULTY_CLASSES = {
  "Beginner-friendly": "bg-success/15 text-success",
  Moderate: "bg-warning/15 text-warning",
  Challenging: "bg-destructive/15 text-destructive",
};

export default function LanguageCard({ id, language, stats, active, previewOpen, onTogglePreview, onOpen }) {
  const { t } = useLanguage();
  const ready = isTrackReady(language);
  const total = (stats?.lessons || 0) + (stats?.challenges || 0);
  const done = (stats?.done || 0) + (stats?.solved || 0);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div
      id={id}
      className={`flex flex-col h-full rounded-2xl border-2 bg-card p-4 transition-all hover:-translate-y-0.5 ${
        active ? "border-primary shadow-game" : "border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/15 to-gem/15 flex items-center justify-center text-2xl leading-none shrink-0"
            aria-hidden="true"
          >
            {language.icon}
          </span>
          <div className="min-w-0">
            <p className="font-game font-extrabold text-lg truncate">{language.name}</p>
            {language.path_summary && <p className="text-xs text-muted-foreground">{language.path_summary}</p>}
          </div>
        </div>
        {language.difficulty && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${DIFFICULTY_CLASSES[language.difficulty] || "bg-secondary text-secondary-foreground"}`}>
            {language.difficulty}
          </span>
        )}
      </div>

      {language.tagline && <p className="text-sm text-muted-foreground mt-3">{language.tagline}</p>}

      {language.use_cases?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {language.use_cases.slice(0, 3).map((use) => (
            <span key={use} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{use}</span>
          ))}
        </div>
      )}

      {ready ? (
        <div className="mt-4 pt-4 border-t-2 border-border">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
            <span>
              {t("codequest.languageProgress", {
                levels: language.levels?.length || 0,
                lessons: stats?.lessons || 0,
                challenges: stats?.challenges || 0,
              })}
            </span>
            <span>{pct}%</span>
          </div>
          <XpBar value={pct} size="sm" className="mt-1.5" />
          <p className="text-xs text-muted-foreground mt-1.5">
            {t("codequest.languageDone", { done: stats?.done || 0, solved: stats?.solved || 0 })}
          </p>
          <div className="flex flex-wrap gap-2 mt-auto pt-3">
            <Button
              onClick={() => onOpen(language.slug)}
              className="h-10 rounded-full font-game font-bold bg-gradient-to-r from-primary to-xp text-primary-foreground shadow-game active:scale-[.97] transition-transform"
            >
              <Play className="w-4 h-4" /> {done > 0 ? t("codequest.continueCoding") : t("codequest.startTrack")}
            </Button>
            <Button variant="outline" onClick={() => onOpen(language.slug)} className="h-10 rounded-full font-game font-bold border-2">
              {t("codequest.viewRoadmap")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t-2 border-border">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-coin/15 text-coin">
            <Sparkles className="w-3.5 h-3.5" /> {t("codequest.curriculumExpanding")}
          </span>
          {previewOpen && (
            <div className="animate-game-pop motion-reduce:animate-none">
              <p className="text-xs text-muted-foreground mt-3">{t("codequest.previewNote")}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(language.roadmap_preview || []).map((world, index) => (
                  <span key={world} className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    <span className="font-game font-extrabold text-foreground">{index + 1}</span> {world}
                  </span>
                ))}
              </div>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="mt-3 rounded-full font-game font-bold border-2"
            onClick={onTogglePreview}
          >
            {previewOpen ? t("codequest.hidePreview") : t("codequest.roadmapPreview")}
            <ChevronDown className={`w-4 h-4 transition-transform ${previewOpen ? "rotate-180" : ""}`} />
          </Button>
        </div>
      )}
    </div>
  );
}