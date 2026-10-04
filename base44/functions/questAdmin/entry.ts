import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { serverError } from '../../shared/http.ts';
import { CHALLENGE_TYPES, DIFFICULTIES, QUEST_TIERS } from '../../shared/quest.ts';

const text = (value: any, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const num = (value: any, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const slugify = (value: any) =>
  text(value, 40)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const stringList = (value: any, maxItems: number, maxLength: number) =>
  Array.isArray(value)
    ? value
        .filter((item) => typeof item === 'string')
        .map((item) => item.trim().slice(0, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

const sanitizeLevels = (value: any) =>
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

const sanitizeTestCases = (value: any) =>
  (Array.isArray(value) ? value.slice(0, 12) : [])
    .map((test: any) => ({
      input: text(test?.input, 300),
      expected_output: text(test?.expected_output, 300),
      visible: test?.visible !== false
    }))
    .filter((test: any) => test.input || test.expected_output);

const sanitizeLanguage = (value: any) => ({
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

const sanitizeLesson = (value: any) => ({
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

const sanitizeChallenge = (value: any) => ({
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

const sanitizeSolution = (value: any) => ({
  answer: text(value?.answer, 2000),
  accepted_answers: stringList(value?.accepted_answers, 8, 2000),
  explanation: text(value?.explanation, 2000),
  hidden_tests: sanitizeTestCases(value?.hidden_tests)
});

const sanitizeAchievement = (value: any) => ({
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

const badRequest = (message: string) => Response.json({ error: message }, { status: 400 });

const languageExists = async (base44: any, slug: string) => {
  if (!slug) return false;
  const page = await base44.entities.ProgrammingLanguage.filter({ slug }, { limit: 1 });
  return Boolean(page.items?.[0]);
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admins only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = text(body?.action, 40);

    if (action === 'language.save') {
      const payload = sanitizeLanguage(body?.language);
      if (!payload.name || !payload.slug) return badRequest('A language name is required');
      const duplicate = await base44.entities.ProgrammingLanguage.filter({ slug: payload.slug }, { limit: 5 });
      const clash = duplicate.items?.find((item: any) => item.id !== body?.language?.id);
      if (clash) return badRequest('Another language already uses that slug');
      const saved = body?.language?.id
        ? await base44.entities.ProgrammingLanguage.update(body.language.id, payload)
        : await base44.entities.ProgrammingLanguage.create(payload);
      return Response.json({ saved });
    }

    if (action === 'language.delete') {
      const id = text(body?.id, 60);
      const language = id ? await base44.entities.ProgrammingLanguage.get(id).catch(() => null) : null;
      if (!language) return badRequest('Language not found');
      const [lessons, challenges] = await Promise.all([
        base44.entities.Lesson.count({ language_slug: language.slug }),
        base44.entities.CodingChallenge.count({ language_slug: language.slug })
      ]);
      if (lessons > 0 || challenges > 0) {
        return badRequest('Remove this language\u2019s lessons and challenges first');
      }
      await base44.entities.ProgrammingLanguage.delete(id);
      return Response.json({ deleted: true });
    }

    if (action === 'lesson.save') {
      const payload = sanitizeLesson(body?.lesson);
      if (!payload.title) return badRequest('A lesson title is required');
      if (!(await languageExists(base44, payload.language_slug))) return badRequest('Add the language first');
      const saved = body?.lesson?.id
        ? await base44.entities.Lesson.update(body.lesson.id, payload)
        : await base44.entities.Lesson.create(payload);
      return Response.json({ saved });
    }

    if (action === 'lesson.delete') {
      const id = text(body?.id, 60);
      if (!id) return badRequest('Lesson is required');
      await base44.entities.Lesson.delete(id);
      return Response.json({ deleted: true });
    }

    if (action === 'challenge.save') {
      const payload = sanitizeChallenge(body?.challenge);
      if (!payload.title || !payload.problem) return badRequest('A title and problem statement are required');
      if (!(await languageExists(base44, payload.language_slug))) return badRequest('Add the language first');

      const saved = body?.challenge?.id
        ? await base44.entities.CodingChallenge.update(body.challenge.id, payload)
        : await base44.entities.CodingChallenge.create(payload);

      const solution = sanitizeSolution(body?.solution);
      const existing = await base44.entities.ChallengeSolution.filter({ challenge_id: saved.id }, { limit: 1 });
      if (existing.items?.[0]) {
        await base44.entities.ChallengeSolution.update(existing.items[0].id, { challenge_id: saved.id, ...solution });
      } else {
        await base44.entities.ChallengeSolution.create({ challenge_id: saved.id, ...solution });
      }
      return Response.json({ saved });
    }

    if (action === 'challenge.delete') {
      const id = text(body?.id, 60);
      if (!id) return badRequest('Challenge is required');
      await base44.entities.CodingChallenge.delete(id);
      await base44.entities.ChallengeSolution.deleteMany({ challenge_id: id });
      return Response.json({ deleted: true });
    }

    if (action === 'achievement.save') {
      const payload = sanitizeAchievement(body?.achievement);
      if (!payload.name || !payload.key) return badRequest('A badge name is required');
      const duplicate = await base44.entities.Achievement.filter({ key: payload.key }, { limit: 5 });
      const clash = duplicate.items?.find((item: any) => item.id !== body?.achievement?.id);
      if (clash) return badRequest('Another badge already uses that key');
      const saved = body?.achievement?.id
        ? await base44.entities.Achievement.update(body.achievement.id, payload)
        : await base44.entities.Achievement.create(payload);
      return Response.json({ saved });
    }

    if (action === 'achievement.delete') {
      const id = text(body?.id, 60);
      if (!id) return badRequest('Badge is required');
      await base44.entities.Achievement.delete(id);
      return Response.json({ deleted: true });
    }

    return badRequest('Unknown action');
  } catch (error) {
    return serverError(error);
  }
}