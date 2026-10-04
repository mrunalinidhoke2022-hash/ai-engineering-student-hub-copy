import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, Rocket, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import EmptyState from "@/components/common/EmptyState";
import QuestStatsBar from "@/components/quest/QuestStatsBar";
import LevelMap from "@/components/quest/LevelMap";
import { ACHIEVEMENT_ICONS, isBossLevel } from "@/components/quest/questLabels";

const CRITERIA_LABELS = {
  xp_total: "XP",
  lessons_completed: "lessons completed",
  challenges_solved: "challenges solved",
  streak_days: "day streak",
};

export default function CodeQuest() {
  const { t } = useLanguage();
  const [languages, setLanguages] = useState([]);
  const [lessonCounts, setLessonCounts] = useState({});
  const [challengeCounts, setChallengeCounts] = useState({});
  const [completedLessons, setCompletedLessons] = useState([]);
  const [solvedAttempts, setSolvedAttempts] = useState([]);
  const [quest, setQuest] = useState(null);
  const [level, setLevel] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [activeSlug, setActiveSlug] = useState("");
  const [content, setContent] = useState({ lessons: [], challenges: [] });
  const [showOverview, setShowOverview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [languagePage, lessonStats, challengeStats, progressPage, attemptPage, stats, badgePage] = await Promise.all([
          base44.entities.ProgrammingLanguage.filter({ enabled: true }, { sort: "sort_order", limit: 50 }),
          base44.entities.Lesson.aggregate({ query: { published: true }, groupBy: "language_slug" }),
          base44.entities.CodingChallenge.aggregate({ query: { published: true }, groupBy: "language_slug" }),
          base44.entities.LessonProgress.list({ limit: 300, fields: ["lesson_id", "language_slug", "level_order"] }),
          base44.entities.ChallengeAttempt.filter({ status: "solved" }, { limit: 300, fields: ["challenge_id", "language_slug", "level_order"] }),
          base44.functions.invoke("questPlay", { action: "stats" }),
          base44.entities.Achievement.filter({ enabled: true }, { sort: "criteria_value", limit: 50 }),
        ]);
        if (cancelled) return;

        setLanguages(languagePage.items || []);
        setLessonCounts(Object.fromEntries((lessonStats.rows || []).map((row) => [row.language_slug, row.count])));
        setChallengeCounts(Object.fromEntries((challengeStats.rows || []).map((row) => [row.language_slug, row.count])));
        setCompletedLessons(progressPage.items || []);
        setSolvedAttempts(attemptPage.items || []);
        setQuest(stats.data?.quest || null);
        setLevel(stats.data?.level || null);
        setAchievements(badgePage.items || []);
      } catch (error) {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeSlug) {
      setContent({ lessons: [], challenges: [] });
      return;
    }
    let cancelled = false;
    Promise.all([
      base44.entities.Lesson.filter({ language_slug: activeSlug, published: true }, { limit: 200, fields: ["id", "level_order"] }),
      base44.entities.CodingChallenge.filter({ language_slug: activeSlug, published: true }, { limit: 200, fields: ["id", "level_order"] }),
    ]).then(([lessonPage, challengePage]) => {
      if (!cancelled) setContent({ lessons: lessonPage.items || [], challenges: challengePage.items || [] });
    });
    return () => {
      cancelled = true;
    };
  }, [activeSlug]);

  const activeLanguage = languages.find((language) => language.slug === activeSlug) || null;

  // Progress per level for the open language, from the student's own records.
  const progressByLevel = useMemo(() => {
    if (!activeSlug) return {};
    const map = {};
    const slot = (order) => {
      if (!map[order]) map[order] = { lessonsDone: 0, lessonsTotal: 0, challengesDone: 0, challengesTotal: 0 };
      return map[order];
    };
    (activeLanguage?.levels || []).forEach((entry) => slot(entry.order));
    content.lessons.forEach((lesson) => {
      slot(lesson.level_order).lessonsTotal += 1;
    });
    content.challenges.forEach((challenge) => {
      slot(challenge.level_order).challengesTotal += 1;
    });
    completedLessons
      .filter((row) => row.language_slug === activeSlug)
      .forEach((row) => {
        slot(row.level_order).lessonsDone += 1;
      });
    solvedAttempts
      .filter((row) => row.language_slug === activeSlug)
      .forEach((row) => {
        slot(row.level_order).challengesDone += 1;
      });
    return map;
  }, [activeSlug, activeLanguage, content, completedLessons, solvedAttempts]);

  const earnedKeys = new Set(quest?.achievements || []);
  const firstLanguage = languages[0] || null;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-sm text-muted-foreground">{t("codequest.loading")}</p>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <EmptyState title={t("codequest.errorTitle")} description={t("codequest.errorBody")} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-3xl">CodeQuest</h1>
      <p className="text-muted-foreground mt-1">{t("codequest.subtitle")}</p>

      <div className="mt-6">
        <QuestStatsBar quest={quest} level={level} />
      </div>

      {quest && quest.xp === 0 && !activeSlug && firstLanguage && (
        <div className="mt-4 flex items-start gap-3 bg-accent/60 border border-border rounded-lg p-4">
          <Rocket className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">{t("codequest.quickStart")}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("codequest.quickStartBody", {
                language: firstLanguage.name,
                level: firstLanguage.levels?.[0]?.title || t("codequest.level") + " 1",
              })}
            </p>
            <button
              type="button"
              onClick={() => setActiveSlug(firstLanguage.slug)}
              className="text-sm font-semibold text-primary mt-2"
            >
              {t("codequest.openTrack", { language: firstLanguage.name })} →
            </button>
          </div>
        </div>
      )}

      {languages.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("codequest.noLanguagesTitle")} description={t("codequest.noLanguagesBody")} />
        </div>
      ) : (
        <div className="mt-8">
          <h2 className="font-heading font-bold text-lg">{t("codequest.chooseLanguage")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {languages.map((language) => {
              const total = lessonCounts[language.slug] || 0;
              const done = completedLessons.filter((row) => row.language_slug === language.slug).length;
              const solved = solvedAttempts.filter((row) => row.language_slug === language.slug).length;
              const challengeTotal = challengeCounts[language.slug] || 0;
              const pct = total ? Math.round((done / total) * 100) : 0;
              const active = language.slug === activeSlug;

              return (
                <button
                  key={language.id}
                  type="button"
                  onClick={() => {
                    setActiveSlug(language.slug);
                    setShowOverview(false);
                  }}
                  className={`text-left bg-card border rounded-lg p-5 transition-colors ${
                    active ? "border-primary" : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="font-heading font-bold text-lg">{language.name}</p>
                  {language.tagline && <p className="text-sm text-muted-foreground mt-0.5">{language.tagline}</p>}
                  <p className="text-xs text-muted-foreground mt-3">
                    {t("codequest.languageProgress", {
                      levels: language.levels?.length || 0,
                      lessons: total,
                      challenges: challengeTotal,
                    })}
                  </p>
                  <div className="h-1.5 rounded-full bg-secondary mt-2 overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {t("codequest.languageDone", { done, solved })}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeLanguage && (
        <div className="mt-10">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-heading font-bold text-xl">{activeLanguage.name} {t("codequest.roadmap")}</h2>
            <button
              type="button"
              onClick={() => setActiveSlug("")}
              className="text-sm font-semibold text-primary"
            >
              {t("codequest.allLanguages")}
            </button>
          </div>

          {(activeLanguage.overview || activeLanguage.setup_guide || activeLanguage.where_used) && (
            <div className="bg-card border border-border rounded-lg mt-4">
              <button
                type="button"
                onClick={() => setShowOverview((value) => !value)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left"
              >
                <span className="font-semibold text-sm">{t("codequest.learningMode")}: {t("codequest.languageBasics")}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showOverview ? "rotate-180" : ""}`} />
              </button>
              {showOverview && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-4">
                  {[
                    ["explanation", t("codequest.whatIsIt")],
                    ["where_used", t("codequest.whereUsed")],
                    ["setup_guide", t("codequest.setup")],
                  ].map(([field, label]) =>
                    activeLanguage[field] ? (
                      <div key={field}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                        <p className="text-sm whitespace-pre-line mt-0.5">{activeLanguage[field]}</p>
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-4">
            <LevelMap slug={activeLanguage.slug} levels={activeLanguage.levels} progressByLevel={progressByLevel} />
          </div>

          {quest?.skill_points?.length > 0 && (
            <div className="mt-8 bg-card border border-border rounded-lg p-5">
              <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" /> {t("codequest.skillScore")}
              </h3>
              <div className="flex flex-wrap gap-2 mt-3">
                {[...quest.skill_points].sort((a, b) => b.points - a.points).slice(0, 10).map((skill) => (
                  <span key={skill.topic} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {skill.topic} · {skill.points} XP
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {achievements.length > 0 && (
        <div className="mt-10">
          <h2 className="font-heading font-bold text-lg">{t("codequest.achievements")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {achievements.map((badge) => {
              const earned = earnedKeys.has(badge.key);
              const Icon = ACHIEVEMENT_ICONS[badge.icon] || ACHIEVEMENT_ICONS.trophy;
              return (
                <div
                  key={badge.id}
                  className={`flex items-start gap-3 border rounded-lg p-4 ${
                    earned ? "border-primary/40 bg-accent/40" : "border-border bg-card opacity-70"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${earned ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">{badge.name}</p>
                    {badge.description && <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {earned
                        ? t("codequest.unlocked")
                        : `${badge.criteria_value} ${CRITERIA_LABELS[badge.criteria_type] || badge.criteria_type}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeLanguage?.levels?.some((entry) => isBossLevel(entry)) && (
        <p className="text-xs text-muted-foreground mt-8">
          {t("codequest.bossHint", { language: activeLanguage.name })}
        </p>
      )}
    </div>
  );
}