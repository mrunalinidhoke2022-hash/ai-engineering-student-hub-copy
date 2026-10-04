import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { throttle } from '../../shared/throttle.ts';
import { serverError } from '../../shared/http.ts';
import {
  addSkillPoints,
  isAutoGraded,
  levelInfo,
  normalizeAnswer,
  streakFromDates,
  unlockedAchievements
} from '../../shared/quest.ts';

const text = (value: any, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const num = (value: any, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// Running student code needs a real sandbox, which this app never hosts itself. Until an
// external code-execution service is configured, code challenges are verified by the
// student and graded challenges stay answer-based.
const executionConfigured = () => {
  try {
    return Boolean(secrets.get('CODE_EXEC_API_URL'));
  } catch {
    return false;
  }
};

// These challenge types cannot be checked by the app yet, so they are finished on the student's own
// word — and a request body can claim anything. A self-verified build therefore earns a small fixed
// reward instead of the challenge's full prize: progress and the level still complete, but full
// credit stays tied to work the app can verify. Once CODE_EXEC_API_URL is set and the sandbox grades
// these types server-side, the cap can be raised to the full reward.
const SELF_VERIFIED_XP_CAP = 10;

// RLS scopes StudentQuest to its owner, so this always resolves to the caller's own record.
const getQuest = async (base44: any) => {
  const page = await base44.entities.StudentQuest.filter({}, { limit: 1 });
  if (page.items?.[0]) return page.items[0];
  return await base44.entities.StudentQuest.create({
    xp: 0,
    coins: 0,
    streak_days: 0,
    best_streak: 0,
    lessons_completed: 0,
    challenges_solved: 0,
    achievements: [],
    skill_points: []
  });
};

// Adds the reward to the student's record, then unlocks any achievement the new totals satisfy.
const award = async (base44: any, delta: any, topic: string | null = null) => {
  const quest = await getQuest(base44);
  const today = new Date().toISOString().slice(0, 10);
  const streak = streakFromDates(quest.last_active_date || null, today, quest.streak_days, quest.best_streak);

  const next: any = {
    xp: (Number(quest.xp) || 0) + delta.xp,
    coins: (Number(quest.coins) || 0) + delta.coins,
    lessons_completed: (Number(quest.lessons_completed) || 0) + delta.lessons,
    challenges_solved: (Number(quest.challenges_solved) || 0) + delta.solved,
    streak_days: streak.streak_days,
    best_streak: streak.best_streak,
    last_active_date: streak.last_active_date,
    skill_points: addSkillPoints(quest.skill_points, topic, delta.skillPoints || 0),
    achievements: quest.achievements || []
  };

  const catalogue = await base44.entities.Achievement.filter({ enabled: true }, { limit: 100 });
  const earned = unlockedAchievements(next, catalogue.items || []);
  const bonus = earned.reduce((sum: number, item: any) => sum + clamp(num(item.xp_reward, 0), 0, 500), 0);
  if (bonus) next.xp += bonus;
  if (earned.length) next.achievements = [...next.achievements, ...earned.map((item: any) => item.key)];

  const updated = await base44.entities.StudentQuest.update(quest.id, next);

  return {
    quest: updated,
    level: levelInfo(updated.xp),
    xp_bonus: bonus,
    new_achievements: earned.map((item: any) => ({
      key: item.key,
      name: item.name,
      icon: item.icon,
      description: item.description
    }))
  };
};

const ensureAttempt = async (base44: any, challenge: any) => {
  const page = await base44.entities.ChallengeAttempt.filter({ challenge_id: challenge.id }, { limit: 1 });
  if (page.items?.[0]) return page.items[0];
  return await base44.entities.ChallengeAttempt.create({
    challenge_id: challenge.id,
    language_slug: challenge.language_slug,
    level_order: challenge.level_order,
    title: challenge.title,
    status: 'attempting',
    attempts: 0,
    hints_used: 0,
    xp_awarded: 0
  });
};

const solve = async (base44: any, challenge: any, attempt: any, extra: any) => {
  // The reward is capped by what the caller's submission actually proved: a graded answer earns the
  // challenge's full value, a self-verified build only the reduced cap.
  const cap = clamp(num(extra?.xp_cap, 200), 5, 200);
  const xp = clamp(num(challenge.xp_reward, 30), 5, cap);
  await base44.entities.ChallengeAttempt.update(attempt.id, {
    status: 'solved',
    attempts: (Number(attempt.attempts) || 0) + 1,
    answer: extra.answer || '',
    xp_awarded: xp,
    solved_at: new Date().toISOString()
  });
  const reward = await award(base44, { xp, coins: Math.floor(xp / 2), lessons: 0, solved: 1, skillPoints: xp }, challenge.topic);
  return Response.json({
    correct: true,
    xp_awarded: xp,
    explanation: extra.explanation || null,
    ...reward
  });
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Every action here writes progress, so one account is capped over a short window.
    const limit = await throttle(base44, 'quest-play', user.id, 120, 600);
    if (!limit.allowed) {
      return Response.json({ error: 'That is a lot of activity at once. Please slow down a little.' }, { status: 429 });
    }

    const body = await req.json().catch(() => ({}));
    const action = text(body?.action, 40);

    if (action === 'stats') {
      const quest = await getQuest(base44);
      return Response.json({ quest, level: levelInfo(quest.xp), execution_available: executionConfigured() });
    }

    if (action === 'lesson.complete') {
      const lessonId = text(body?.lesson_id, 60);
      if (!lessonId) return Response.json({ error: 'Lesson is required' }, { status: 400 });

      const lesson = await base44.entities.Lesson.get(lessonId).catch(() => null);
      if (!lesson || lesson.published === false) {
        return Response.json({ error: 'Lesson not found' }, { status: 404 });
      }

      const existing = await base44.entities.LessonProgress.filter({ lesson_id: lessonId }, { limit: 1 });
      if (existing.items?.[0]) {
        const quest = await getQuest(base44);
        return Response.json({ already_completed: true, quest, level: levelInfo(quest.xp) });
      }

      const xp = clamp(num(lesson.xp_reward, 20), 5, 100);
      await base44.entities.LessonProgress.create({
        lesson_id: lessonId,
        language_slug: lesson.language_slug,
        level_order: lesson.level_order,
        title: lesson.title,
        xp_awarded: xp,
        completed_at: new Date().toISOString()
      });

      const reward = await award(base44, { xp, coins: Math.floor(xp / 2), lessons: 1, solved: 0, skillPoints: 0 });
      return Response.json({ xp_awarded: xp, ...reward });
    }

    if (action === 'challenge.hint' || action === 'challenge.submit') {
      const challengeId = text(body?.challenge_id, 60);
      if (!challengeId) return Response.json({ error: 'Challenge is required' }, { status: 400 });

      const challenge = await base44.entities.CodingChallenge.get(challengeId).catch(() => null);
      if (!challenge || challenge.published === false) {
        return Response.json({ error: 'Challenge not found' }, { status: 404 });
      }

      const attempt = await ensureAttempt(base44, challenge);
      if (attempt.status === 'solved') {
        const quest = await getQuest(base44);
        return Response.json({ correct: true, already_solved: true, quest, level: levelInfo(quest.xp) });
      }

      if (action === 'challenge.hint') {
        const updated = await base44.entities.ChallengeAttempt.update(attempt.id, {
          hints_used: clamp((Number(attempt.hints_used) || 0) + 1, 0, 20)
        });
        return Response.json({ hints_used: updated.hints_used });
      }

      const answer = text(body?.answer, 2000);
      const selfVerified = body?.self_verified === true;

      if (!isAutoGraded(challenge.type)) {
        if (!selfVerified) {
          const available = executionConfigured();
          return Response.json({
            graded: false,
            execution_available: available,
            message: available
              ? 'Your code could not be checked automatically. Build it, compare the output with the expected output, then mark it built.'
              : 'Checking code automatically needs a secure code-execution service, which is not connected yet. Build and test this one yourself, compare the output with the expected output above, then mark it built.'
          });
        }
        await base44.entities.ChallengeAttempt.update(attempt.id, { answer });
        return await solve(base44, challenge, attempt, { answer, xp_cap: SELF_VERIFIED_XP_CAP });
      }

      // The answer and explanation live in an admin-only record, so the client never sees them.
      const solutionPage = await base44.asServiceRole.entities.ChallengeSolution.filter({ challenge_id: challengeId }, { limit: 1 });
      const solution = solutionPage.items?.[0];
      if (!solution?.answer) {
        return Response.json({ error: 'This challenge is not ready to be graded yet.' }, { status: 400 });
      }

      const attempts = (Number(attempt.attempts) || 0) + 1;
      const accepted = [solution.answer, ...(Array.isArray(solution.accepted_answers) ? solution.accepted_answers : [])]
        .map((value: any) => normalizeAnswer(value))
        .filter(Boolean);

      if (!answer || !accepted.includes(normalizeAnswer(answer))) {
        await base44.entities.ChallengeAttempt.update(attempt.id, { attempts, answer });
        return Response.json({
          correct: false,
          attempts,
          hint_available_after: 2,
          message:
            attempts >= 3
              ? 'Still not right. Read the explanation, compare it with your answer, and try once more.'
              : 'Not quite. Use the next hint and try again.',
          explanation: attempts >= 3 ? solution.explanation || null : null
        });
      }

      return await solve(base44, challenge, attempt, { answer, explanation: solution.explanation || null });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return serverError(error);
  }
}