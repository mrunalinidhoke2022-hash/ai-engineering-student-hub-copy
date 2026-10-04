// CodeQuest rules that both the backend and the UI need: the XP/level curve, the daily
// streak, which achievements a student has just unlocked, and which challenge types the
// server can grade on its own (the rest need a secure code-execution service).

export const QUEST_TIERS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
export const CHALLENGE_TYPES = [
  'multiple_choice',
  'predict_output',
  'fix_bug',
  'complete_code',
  'write_code',
  'optimize_code',
  'debug_program',
  'build_function',
  'build_mini_app'
];
export const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Expert'];

// Only these types carry an answer the server can check without running student code.
const AUTO_GRADED_TYPES = ['multiple_choice', 'predict_output', 'fix_bug', 'complete_code'];

export const isAutoGraded = (type) => AUTO_GRADED_TYPES.includes(type);

// Challenges that need the program to actually run are only graded when a sandboxed
// execution service is configured; without it the student verifies and marks their build.
export const needsExecution = (type) => !isAutoGraded(type);

export const normalizeAnswer = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

// Level 1 needs 100 XP, and every level after it asks for 100 more than the last.
export const levelInfo = (xp) => {
  let level = 1;
  let remaining = Math.max(0, Math.floor(Number(xp) || 0));
  let needed = 100;
  while (remaining >= needed) {
    remaining -= needed;
    level += 1;
    needed += 100;
  }
  return {
    level,
    xpIntoLevel: remaining,
    xpForNextLevel: needed,
    progressPct: Math.min(100, Math.round((remaining / needed) * 100))
  };
};

// `lastActive` and `today` are UTC calendar days (YYYY-MM-DD), so a streak can never be
// inflated by clock skew inside one day.
export const streakFromDates = (lastActive, today, currentStreak, bestStreak) => {
  const streak = Number(currentStreak) || 0;
  const best = Number(bestStreak) || 0;
  if (!lastActive) return { streak_days: 1, best_streak: Math.max(best, 1), last_active_date: today };
  if (lastActive === today) return { streak_days: streak, best_streak: best, last_active_date: today };
  const gapDays = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${lastActive}T00:00:00Z`)) / 86400000
  );
  const next = gapDays === 1 ? streak + 1 : 1;
  return { streak_days: next, best_streak: Math.max(best, next), last_active_date: today };
};

const progressFor = (stats, criteriaType) => {
  switch (criteriaType) {
    case 'xp_total':
      return Number(stats.xp) || 0;
    case 'lessons_completed':
      return Number(stats.lessons_completed) || 0;
    case 'challenges_solved':
      return Number(stats.challenges_solved) || 0;
    case 'streak_days':
      return Number(stats.streak_days) || 0;
    default:
      return 0;
  }
};

// Achievements the student has satisfied but does not hold yet.
export const unlockedAchievements = (stats, catalogue) => {
  const held = new Set(stats.achievements || []);
  return (catalogue || []).filter(
    (achievement) =>
      achievement?.enabled !== false &&
      achievement?.key &&
      !held.has(achievement.key) &&
      progressFor(stats, achievement.criteria_type) >= (Number(achievement.criteria_value) || 1)
  );
};

// Keeps one skill score per challenge topic.
export const addSkillPoints = (existing, topic, points) => {
  const list = Array.isArray(existing) ? existing.filter((entry) => entry?.topic) : [];
  const name = String(topic || '').trim().slice(0, 80);
  if (!name || !points) return list.slice(0, 40);
  const found = list.find((entry) => entry.topic.toLowerCase() === name.toLowerCase());
  if (found) {
    return list.map((entry) =>
      entry.topic.toLowerCase() === name.toLowerCase() ? { ...entry, points: (Number(entry.points) || 0) + points } : entry
    );
  }
  return [...list, { topic: name, points }].slice(-40);
};