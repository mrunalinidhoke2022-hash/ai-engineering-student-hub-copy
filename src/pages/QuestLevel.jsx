import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useToast } from "@/components/ui/use-toast";
import EmptyState from "@/components/common/EmptyState";
import LessonCard from "@/components/quest/LessonCard";
import ChallengeCard from "@/components/quest/ChallengeCard";
import { isBossLevel } from "@/components/quest/questLabels";

export default function QuestLevel() {
  const { slug, order } = useParams();
  const levelOrder = Number(order);
  const { t } = useLanguage();
  const { toast } = useToast();

  const [language, setLanguage] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [attempts, setAttempts] = useState({});
  const [currentLevel, setCurrentLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const [languagePage, lessonPage, challengePage, progressPage, attemptPage, stats] = await Promise.all([
        base44.entities.ProgrammingLanguage.filter({ slug }, { limit: 1 }),
        base44.entities.Lesson.filter(
          { language_slug: slug, level_order: levelOrder, published: true },
          { sort: "order", limit: 50 }
        ),
        base44.entities.CodingChallenge.filter(
          { language_slug: slug, level_order: levelOrder, published: true },
          { limit: 50 }
        ),
        base44.entities.LessonProgress.filter({ language_slug: slug, level_order: levelOrder }, { limit: 100 }),
        base44.entities.ChallengeAttempt.filter({ language_slug: slug, level_order: levelOrder }, { limit: 100 }),
        base44.functions.invoke("questPlay", { action: "stats" }),
      ]);
      if (cancelled) return;

      setLanguage(languagePage.items?.[0] || null);
      setLessons(lessonPage.items || []);
      setChallenges(challengePage.items || []);
      setCompletedIds(new Set((progressPage.items || []).map((row) => row.lesson_id)));
      setAttempts(Object.fromEntries((attemptPage.items || []).map((row) => [row.challenge_id, row])));
      setCurrentLevel(stats.data?.level || null);
    };

    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, levelOrder]);

  const announce = (reward) => {
    if (!reward || reward.already_completed) return;
    const gained = [`+${reward.xp_awarded} XP`];
    if (reward.xp_bonus) gained.push(`+${reward.xp_bonus} bonus XP`);
    toast({ description: `${t("codequest.missionComplete")} ${gained.join(" · ")}` });
    if (currentLevel && reward.level?.level > currentLevel.level) {
      toast({ description: t("codequest.levelUp", { level: reward.level.level }) });
    }
    if (reward.level) setCurrentLevel(reward.level);
    (reward.new_achievements || []).forEach((badge) => {
      toast({ description: t("codequest.badgeUnlocked", { name: badge.name }) });
    });
  };

  const completeLesson = useCallback(
    async (lesson) => {
      setCompletedIds((previous) => new Set(previous).add(lesson.id));
      try {
        const response = await base44.functions.invoke("questPlay", {
          action: "lesson.complete",
          lesson_id: lesson.id,
        });
        announce(response.data);
      } catch (error) {
        setCompletedIds((previous) => {
          const next = new Set(previous);
          next.delete(lesson.id);
          return next;
        });
        toast({ description: t("codequest.saveFailed"), variant: "destructive" });
      }
    },
    [currentLevel, t, toast]
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <p className="text-sm text-muted-foreground">{t("codequest.loading")}</p>
      </div>
    );
  }

  const levels = language?.levels || [];
  const level = levels.find((entry) => entry.order === levelOrder) || null;
  if (!language || !level) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <EmptyState title={t("codequest.levelMissingTitle")} description={t("codequest.levelMissingBody")} />
      </div>
    );
  }

  const solvedCount = challenges.filter((challenge) => attempts[challenge.id]?.status === "solved").length;
  const total = lessons.length + challenges.length;
  const done = completedIds.size + solvedCount;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const boss = isBossLevel(level);
  const position = levels.findIndex((entry) => entry.order === levelOrder);
  const previous = position > 0 ? levels[position - 1] : null;
  const next = position >= 0 && position < levels.length - 1 ? levels[position + 1] : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/codequest" className="text-sm font-semibold text-primary">
        ← {t("codequest.backToMap")}
      </Link>

      <div className="mt-4 flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-heading font-extrabold shrink-0 ${boss ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"}`}>
          {boss ? <Flame className="w-6 h-6" /> : level.order}
        </div>
        <div className="min-w-0">
          <h1 className="font-heading font-extrabold text-2xl">{level.title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {language.name}
            {level.tier ? ` · ${level.tier}` : ""}
            {total ? ` · ${t("codequest.doneCount", { done, total })}` : ""}
          </p>
        </div>
      </div>

      {level.focus && <p className="text-sm mt-3">{level.focus}</p>}
      {level.topics?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {level.topics.map((topic, index) => (
            <span key={index} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {topic}
            </span>
          ))}
        </div>
      )}
      {total > 0 && (
        <div className="h-1.5 rounded-full bg-secondary mt-4 overflow-hidden">
          <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      )}

      <section className="mt-8">
        <h2 className="font-heading font-bold text-lg">{t("codequest.learningMode")}</h2>
        {lessons.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">{t("codequest.noLessons")}</p>
        ) : (
          <div className="space-y-3 mt-3">
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                completed={completedIds.has(lesson.id)}
                onComplete={completeLesson}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-heading font-bold text-lg">{t("codequest.practice")}</h2>
        {challenges.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">{t("codequest.noChallenges")}</p>
        ) : (
          <div className="space-y-3 mt-3">
            {challenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} attempt={attempts[challenge.id]} />
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between gap-3 mt-10">
        {previous ? (
          <Link to={`/codequest/${slug}/${previous.order}`} className="text-sm font-semibold text-primary inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={`/codequest/${slug}/${next.order}`} className="text-sm font-semibold text-primary inline-flex items-center gap-1 text-right">
            {next.title} <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}