import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Rocket, Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import EmptyState from "@/components/common/EmptyState";
import QuestHero from "@/components/quest/QuestHero";
import QuestStatsBar from "@/components/quest/QuestStatsBar";
import QuestGuide from "@/components/quest/QuestGuide";
import LanguageCatalog from "@/components/quest/LanguageCatalog";
import LevelMap from "@/components/quest/LevelMap";
import QuestShell from "@/components/quest/QuestShell";
import { ACHIEVEMENT_ICONS, isBossLevel } from "@/components/quest/questLabels";

const CRITERIA_LABELS = {
  xp_total: "XP",
  lessons_completed: "lessons completed",
  challenges_solved: "challenges solved",
  streak_days: "day streak",
};

const readLastSlug = () => {
  try {
    return window.localStorage.getItem("codequest:last-language") || "";
  } catch {
    return "";
  }
};

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ block: "start" });

export default function CodeQuest() {
  const { t } = useLanguage();
  const navigate = useNavigate();
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
  const [dailyPool, setDailyPool] = useState([]);
  const [lastSlug, setLastSlug] = useState(readLastSlug);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const [languagePage, lessonStats, challengeStats, progressPage, attemptPage, stats, badgePage, dailyPage] = await Promise.all([
          base44.entities.ProgrammingLanguage.filter({ enabled: true }, { sort: "sort_order", limit: 60 }),
          base44.entities.Lesson.aggregate({ query: { published: true }, groupBy: "language_slug" }),
          base44.entities.CodingChallenge.aggregate({ query: { published: true }, groupBy: "language_slug" }),
          base44.entities.LessonProgress.list({ limit: 300, fields: ["lesson_id", "language_slug", "level_order"] }),
          base44.entities.ChallengeAttempt.filter({ status: "solved" }, { limit: 300, fields: ["challenge_id", "language_slug", "level_order"] }),
          base44.functions.invoke("questPlay", { action: "stats" }),
          base44.entities.Achievement.filter({ enabled: true }, { sort: "criteria_value", limit: 50 }),
          base44.entities.CodingChallenge.filter(
            { published: true },
            { limit: 60, sort: "created_date", fields: ["id", "title", "language_slug", "type", "difficulty", "xp_reward", "level_order"] }
          ),
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
        setDailyPool(dailyPage.items || []);
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
  const earnedKeys = new Set(quest?.achievements || []);
  const started = Number(quest?.xp) > 0;

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

  // Per-language totals and the student's own progress, for the catalogue cards.
  const languageProgress = useMemo(() => {
    const map = {};
    languages.forEach((language) => {
      map[language.slug] = {
        lessons: lessonCounts[language.slug] || 0,
        challenges: challengeCounts[language.slug] || 0,
        done: completedLessons.filter((row) => row.language_slug === language.slug).length,
        solved: solvedAttempts.filter((row) => row.language_slug === language.slug).length,
      };
    });
    return map;
  }, [languages, lessonCounts, challengeCounts, completedLessons, solvedAttempts]);

  const readyLanguages = useMemo(
    () => languages.filter((language) => language.curriculum_status === "ready" && (language.levels?.length || 0) > 0),
    [languages]
  );

  // The track to continue: the last one opened, else the one with the most progress.
  const recommended = useMemo(() => {
    const marks = (slug) => (languageProgress[slug]?.done || 0) + (languageProgress[slug]?.solved || 0);
    return (
      readyLanguages.find((language) => language.slug === lastSlug) ||
      [...readyLanguages].sort((a, b) => marks(b.slug) - marks(a.slug))[0] ||
      null
    );
  }, [readyLanguages, lastSlug, languageProgress]);

  // Today's challenge: the same pick for everyone all day, and a different one tomorrow.
  const dailyChallenge = useMemo(() => {
    if (!dailyPool.length) return null;
    const day = new Date().toISOString().slice(0, 10);
    const seed = [...day].reduce((sum, character) => sum + character.charCodeAt(0), 0);
    return dailyPool[seed % dailyPool.length];
  }, [dailyPool]);

  const openTrack = (slug) => {
    setActiveSlug(slug);
    setShowOverview(false);
    setLastSlug(slug);
    try {
      window.localStorage.setItem("codequest:last-language", slug);
    } catch {
      // Storage can be blocked; the session still works, it just forgets the track.
    }
  };

  const startCoding = () => {
    if (!recommended) return;
    const marks = [...completedLessons, ...solvedAttempts]
      .filter((row) => row.language_slug === recommended.slug)
      .map((row) => Number(row.level_order) || 1);
    const lastLevel = recommended.levels?.length || 1;
    const nextOrder = marks.length ? Math.min(lastLevel, Math.max(...marks) + 1) : 1;
    navigate(`/codequest/${recommended.slug}/${nextOrder}`);
  };

  const openRoadmap = () => {
    if (!recommended) return;
    openTrack(recommended.slug);
    window.requestAnimationFrame(() => scrollToId("quest-roadmap"));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-sm text-muted-foreground">{t("codequest.loading")}</p>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="min-h-screen bg-background max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <EmptyState title={t("codequest.errorTitle")} description={t("codequest.errorBody")} />
      </div>
    );
  }

  return (
    <QuestShell wide>
      <QuestHero
        quest={quest}
        level={level}
        trackName={recommended?.name}
        badges={earnedKeys.size}
        languagesCount={languages.length}
        daily={dailyChallenge}
        onStart={startCoding}
        onRoadmap={openRoadmap}
        onDaily={() => dailyChallenge && navigate(`/codequest/challenge/${dailyChallenge.id}`)}
        onAchievements={() => scrollToId("quest-achievements")}
      />

      <div className="mt-4">
        <QuestStatsBar quest={quest} level={level} />
      </div>

      {!started && !activeSlug && recommended && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border-2 border-border bg-card p-4">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-xp text-white flex items-center justify-center shrink-0">
            <Rocket className="w-5 h-5" />
          </span>
          <div>
            <p className="font-semibold text-sm">{t("codequest.quickStart")}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("codequest.quickStartBody", {
                language: recommended.name,
                level: recommended.levels?.[0]?.title || t("codequest.level") + " 1",
              })}
            </p>
            <button
              type="button"
              onClick={() => openTrack(recommended.slug)}
              className="text-sm font-semibold text-primary mt-2"
            >
              {t("codequest.openTrack", { language: recommended.name })} →
            </button>
          </div>
        </div>
      )}

      <QuestGuide defaultOpen={!started} />

      {languages.length === 0 ? (
        <div className="mt-8">
          <EmptyState title={t("codequest.noLanguagesTitle")} description={t("codequest.noLanguagesBody")} />
        </div>
      ) : (
        <div className="mt-8" id="quest-languages">
          <h2 className="font-game font-extrabold text-xl">{t("codequest.chooseLanguage")}</h2>
          <LanguageCatalog
            languages={languages}
            progress={languageProgress}
            activeSlug={activeSlug}
            onOpen={openTrack}
          />
        </div>
      )}

      {activeLanguage && (
        <div className="mt-10" id="quest-roadmap">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="font-game font-extrabold text-2xl">{activeLanguage.name} {t("codequest.roadmap")}</h2>
            <button
              type="button"
              onClick={() => setActiveSlug("")}
              className="text-sm font-semibold text-primary"
            >
              {t("codequest.allLanguages")}
            </button>
          </div>

          {(activeLanguage.overview || activeLanguage.setup_guide || activeLanguage.where_used) && (
            <div className="bg-card border-2 border-border rounded-2xl mt-4">
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
            <div className="mt-8 bg-card border-2 border-border rounded-2xl p-5">
              <h3 className="font-game font-extrabold text-xl flex items-center gap-2">
                <Star className="w-4 h-4 text-coin" /> {t("codequest.skillScore")}
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
        <div className="mt-10" id="quest-achievements">
          <h2 className="font-game font-extrabold text-xl">{t("codequest.achievements")}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {achievements.map((badge) => {
              const earned = earnedKeys.has(badge.key);
              const Icon = ACHIEVEMENT_ICONS[badge.icon] || ACHIEVEMENT_ICONS.trophy;
              return (
                <div
                  key={badge.id}
                  className={`flex items-start gap-3 rounded-2xl border-2 p-4 transition-all ${
                    earned
                      ? "border-coin/50 bg-gradient-to-br from-coin/15 via-card to-gem/10 shadow-game-coin"
                      : "border-dashed border-border bg-card/60"
                  }`}
                >
                  <span className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${earned ? "bg-gradient-to-br from-coin to-streak text-white" : "bg-secondary text-muted-foreground"}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <p className={`font-game font-extrabold text-base ${earned ? "" : "text-muted-foreground"}`}>{badge.name}</p>
                    {badge.description && <p className="text-xs text-muted-foreground mt-0.5">{badge.description}</p>}
                    <p className={`text-xs font-bold mt-1 ${earned ? "text-coin" : "text-muted-foreground"}`}>
                      {earned
                        ? `★ ${t("codequest.unlocked")}`
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
    </QuestShell>
  );
}