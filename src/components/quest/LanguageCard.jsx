import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const DIFFICULTY_CLASSES = {
  "Beginner-friendly": "bg-success/10 text-success",
  Moderate: "bg-warning/10 text-warning",
  Challenging: "bg-destructive/10 text-destructive",
};

// A track is playable only once it has a published level map; everything else is a roadmap preview.
export const isTrackReady = (language) => language?.curriculum_status === "ready" && (language?.levels?.length || 0) > 0;

export default function LanguageCard({ id, language, stats, active, previewOpen, onTogglePreview, onOpen }) {
  const { t } = useLanguage();
  const ready = isTrackReady(language);
  const total = (stats?.lessons || 0) + (stats?.challenges || 0);
  const done = (stats?.done || 0) + (stats?.solved || 0);
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <div id={id} className={`bg-card border rounded-lg p-5 flex flex-col h-full ${active ? "border-primary" : "border-border"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-2xl leading-none" aria-hidden="true">{language.icon}</span>
          <div className="min-w-0">
            <p className="font-heading font-bold text-lg truncate">{language.name}</p>
            {language.path_summary && <p className="text-xs text-muted-foreground">{language.path_summary}</p>}
          </div>
        </div>
        {language.difficulty && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${DIFFICULTY_CLASSES[language.difficulty] || "bg-secondary text-secondary-foreground"}`}>
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
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("codequest.languageProgress", {
                levels: language.levels?.length || 0,
                lessons: stats?.lessons || 0,
                challenges: stats?.challenges || 0,
              })}
            </span>
            <span>{pct}%</span>
          </div>
          <Progress value={pct} className="h-1.5 mt-1.5" />
          <p className="text-xs text-muted-foreground mt-1.5">
            {t("codequest.languageDone", { done: stats?.done || 0, solved: stats?.solved || 0 })}
          </p>
          <div className="flex gap-2 mt-4">
            <Button size="sm" onClick={() => onOpen(language.slug)}>
              {done > 0 ? t("codequest.continueCoding") : t("codequest.startTrack")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => onOpen(language.slug)}>
              {t("codequest.viewRoadmap")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning">
            {t("codequest.curriculumExpanding")}
          </span>
          {previewOpen && (
            <>
              <p className="text-xs text-muted-foreground mt-3">{t("codequest.previewNote")}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(language.roadmap_preview || []).map((world, index) => (
                  <span key={world} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {index + 1}. {world}
                  </span>
                ))}
              </div>
            </>
          )}
          <Button size="sm" variant="outline" className="mt-4" onClick={onTogglePreview}>
            {previewOpen ? t("codequest.hidePreview") : t("codequest.roadmapPreview")}
          </Button>
        </div>
      )}
    </div>
  );
}