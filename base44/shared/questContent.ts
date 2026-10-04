// Quest content rules shared by the admin content manager (questAdmin) and the curriculum
// generator (questSeed). Both hand-written and generated lessons and challenges pass through
// these sanitizers, so they are held to one set of field limits and one allowlist of challenge
// types, difficulties and tiers — generated content can never widen what the app accepts.

import { CHALLENGE_TYPES, DIFFICULTIES, QUEST_TIERS } from './quest.ts';

export const text = (value: any, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
export const num = (value: any, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
export const slugify = (value: any) =>
  text(value, 40)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const stringList = (value: any, maxItems: number, maxLength: number) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim().slice(0, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

export const sanitizeLevels = (value: any) =>
  (Array.isArray(value) ? value.slice(0, 20) : [])
    .map((level: any, index: number) => ({
      order: num(level?.order, index + 1),
      title: text(level?.title, 120),
      tier: QUEST_TIERS.includes(level?.tier) ? level.tier : 'Beginner',
      focus: text(level?.focus, 300),
      topics: stringList(level?.topics, 12, 80)
    }))
    .filter((level: any) => level.title)
    .sort((a: any, b: any) => a.order - b.order)
    .map((level: any, index: number) => ({ ...level, order: index + 1 }));

export const sanitizeTestCases = (value: any) =>
  (Array.isArray(value) ? value.slice(0, 12) : [])
    .map((test: any) => ({
      input: text(test?.input, 300),
      expected_output: text(test?.expected_output, 300),
      visible: test?.visible !== false
    }))
    .filter((test: any) => test.input || test.expected_output);

export const sanitizeLanguage = (value: any) => ({
  name: text(value?.name, 60),
  slug: slugify(value?.slug || value?.name),
  tagline: text(value?.tagline, 200),
  overview: text(value?.overview, 4000),
  where_used: text(value?.where_used, 2000),
  setup_guide: text(value?.setup_guide, 4000),
  levels: sanitizeLevels(value?.levels),
  enabled: value?.enabled !== false,
  sort_order: num(value?.sort_order, 0)
});

export const sanitizeLesson = (value: any) => ({
  language_slug: slugify(value?.language_slug),
  level_order: num(value?.level_order, 1),
  title: text(value?.title, 160),
  order: num(value?.order, 0),
  summary: text(value?.summary, 400),
  explanation: text(value?.explanation, 4000),
  real_world_example: text(value?.real_world_example, 1000),
  code_example: text(value?.code_example, 2000),
  try_it: text(value?.try_it, 600),
  practice_question: text(value?.practice_question, 600),
  common_mistake: text(value?.common_mistake, 600),
  hint: text(value?.hint, 600),
  solution_explanation: text(value?.solution_explanation, 1000),
  mini_challenge: text(value?.mini_challenge, 600),
  xp_reward: num(value?.xp_reward, 20),
  published: value?.published !== false
});

export const sanitizeChallenge = (value: any) => ({
  language_slug: slugify(value?.language_slug),
  level_order: num(value?.level_order, 1),
  title: text(value?.title, 160),
  type: CHALLENGE_TYPES.includes(value?.type) ? value.type : 'multiple_choice',
  difficulty: DIFFICULTIES.includes(value?.difficulty) ? value.difficulty : 'Easy',
  topic: text(value?.topic, 80),
  problem: text(value?.problem, 4000),
  expected_input: text(value?.expected_input, 600),
  expected_output: text(value?.expected_output, 600),
  constraints: text(value?.constraints, 600),
  example: text(value?.example, 1000),
  starter_code: text(value?.starter_code, 4000),
  options: stringList(value?.options, 8, 300),
  test_cases: sanitizeTestCases(value?.test_cases),
  hints: stringList(value?.hints, 6, 400),
  xp_reward: num(value?.xp_reward, 30),
  published: value?.published !== false
});

export const sanitizeSolution = (value: any) => ({
  answer: text(value?.answer, 2000),
  accepted_answers: stringList(value?.accepted_answers, 8, 2000),
  explanation: text(value?.explanation, 2000),
  hidden_tests: sanitizeTestCases(value?.hidden_tests)
});

export const sanitizeAchievement = (value: any) => ({
  key: slugify(value?.key || value?.name),
  name: text(value?.name, 120),
  description: text(value?.description, 300),
  icon: text(value?.icon, 30),
  criteria_type: ['xp_total', 'lessons_completed', 'challenges_solved', 'streak_days'].includes(value?.criteria_type)
    ? value.criteria_type
    : 'xp_total',
  criteria_value: Math.max(1, num(value?.criteria_value, 1)),
  xp_reward: num(value?.xp_reward, 50),
  enabled: value?.enabled !== false
});