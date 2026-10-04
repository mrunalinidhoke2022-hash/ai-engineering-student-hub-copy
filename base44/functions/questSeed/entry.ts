import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { serverError } from '../../shared/http.ts';
import {
  sanitizeChallenge,
  sanitizeLesson,
  sanitizeLevels,
  sanitizeSolution
} from '../../shared/questContent.ts';

// Builds the CodeQuest curriculum for one language track in small, resumable batches.
//
// A track is deliberately not made playable until it is whole: the level map is saved first, then
// each level's lessons and challenges are generated a level at a time, and only once every level
// is complete does the track flip to curriculum_status "ready" — which is what turns the
// "curriculum expanding" preview into a Start button on the CodeQuest page.
//
// The shape copies the tracks already live in the app: 11 levels, three lessons and three
// challenges per level, ending on a final-boss project. The first two challenges of every level
// are types the app can grade by itself; the third varies by level and the build-style ones are
// finished on the student's own word, exactly as in the existing tracks.

const TRACK_LEVELS = 11;
const LESSONS_PER_LEVEL = 3;
const CHALLENGES_PER_LEVEL = 3;

const text = (value: any, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const num = (value: any, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

const BUILD_BY_LEVEL: any = {
  1: 'complete_code',
  2: 'complete_code',
  3: 'fix_bug',
  4: 'fix_bug',
  5: 'complete_code',
  6: 'complete_code',
  7: 'fix_bug',
  8: 'write_code',
  9: 'write_code',
  10: 'build_function',
  11: 'build_mini_app'
};

// Only these are checked by the app itself (against the stored answer); the rest are build tasks
// the student finishes and marks built, because running student code needs an external sandbox.
const AUTO_GRADED = ['multiple_choice', 'predict_output', 'fix_bug', 'complete_code'];
const DIFFICULTY_LADDER = ['Easy', 'Medium', 'Hard', 'Expert'];

const levelDifficulty = (order: number) =>
  order <= 4 ? 'Easy' : order <= 8 ? 'Medium' : order <= 10 ? 'Hard' : 'Expert';

const oneNotchHarder = (value: string) =>
  DIFFICULTY_LADDER[Math.min(DIFFICULTY_LADDER.length - 1, DIFFICULTY_LADDER.indexOf(value) + 1)];

// Reward curve of the live tracks: 22 challenges at 30 XP, 7 at 40 XP and 4 at 50 XP per track.
const xpFor = (type: string, order: number) => {
  if (type === 'multiple_choice') return order <= 7 ? 30 : order <= 10 ? 40 : 50;
  if (type === 'predict_output') return order <= 8 ? 30 : order <= 10 ? 40 : 50;
  return order <= 7 ? 30 : order <= 9 ? 40 : 50;
};

const planFor = (order: number) => [
  { kind: 'a', type: 'multiple_choice', difficulty: levelDifficulty(order), xp: xpFor('multiple_choice', order) },
  { kind: 'b', type: 'predict_output', difficulty: levelDifficulty(order), xp: xpFor('predict_output', order) },
  {
    kind: 'c',
    type: BUILD_BY_LEVEL[order] || 'complete_code',
    difficulty: oneNotchHarder(levelDifficulty(order)),
    xp: xpFor(BUILD_BY_LEVEL[order] || 'complete_code', order)
  }
];

const LEVEL_MAP_SCHEMA = {
  type: 'object',
  properties: {
    levels: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          order: { type: 'number' },
          title: { type: 'string' },
          tier: { type: 'string' },
          focus: { type: 'string' },
          topics: { type: 'array', items: { type: 'string' } }
        },
        required: ['order', 'title', 'tier', 'focus', 'topics']
      }
    }
  },
  required: ['levels']
};

const CONTENT_SCHEMA = {
  type: 'object',
  properties: {
    lessons: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string' },
          explanation: { type: 'string' },
          real_world_example: { type: 'string' },
          code_example: { type: 'string' },
          try_it: { type: 'string' },
          practice_question: { type: 'string' },
          common_mistake: { type: 'string' },
          hint: { type: 'string' },
          solution_explanation: { type: 'string' },
          mini_challenge: { type: 'string' }
        },
        required: ['title', 'summary', 'explanation', 'code_example', 'practice_question', 'hint', 'solution_explanation']
      }
    },
    challenges: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: { type: 'string' },
          type: { type: 'string' },
          topic: { type: 'string' },
          problem: { type: 'string' },
          expected_input: { type: 'string' },
          expected_output: { type: 'string' },
          constraints: { type: 'string' },
          example: { type: 'string' },
          starter_code: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          test_cases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                input: { type: 'string' },
                expected_output: { type: 'string' },
                visible: { type: 'boolean' }
              },
              required: ['input', 'expected_output', 'visible']
            }
          },
          hints: { type: 'array', items: { type: 'string' } },
          answer: { type: 'string' },
          accepted_answers: { type: 'array', items: { type: 'string' } },
          explanation: { type: 'string' }
        },
        required: ['kind', 'type', 'topic', 'problem', 'expected_output', 'hints', 'answer', 'explanation']
      }
    }
  },
  required: ['lessons', 'challenges']
};

const levelMapPrompt = (language: any) => {
  const roadmap = Array.isArray(language.roadmap_preview) ? language.roadmap_preview.join(' | ') : '';
  return `You are designing the level map of one programming-language track on DEVLAUNCH, a free learning and practice platform for engineering students.

TRACK: ${language.name} (${language.slug})
TAGLINE: ${language.tagline || ''}
ROADMAP ALREADY ADVERTISED TO STUDENTS: ${roadmap}

Design exactly ${TRACK_LEVELS} levels that take a complete beginner to a finished real project, and return them as JSON.

Rules:
- Exactly ${TRACK_LEVELS} levels, with "order" from 1 to ${TRACK_LEVELS}.
- Tiers: levels 1 to 4 are "Beginner", levels 5 to 7 are "Intermediate", levels 8 and 9 are "Advanced", levels 10 and 11 are "Expert".
- "title": two to four words, specific to ${language.name} (for example "Object-Oriented ${language.name}"), never generic filler text.
- Level ${TRACK_LEVELS} must be titled "Final Boss — Build a Real ${language.name} Project" with the topics planning, building and testing.
- "focus": one plain sentence, at most 120 characters, describing what the level teaches.
- "topics": exactly three short labels of one to three words each, naming the real syntax or ideas of that level.
- Level 1 assumes the student has never written a line of ${language.name}; level 2 onward builds up: setup and first program, variables and data, conditions, loops, functions and modules, collections, objects and errors, libraries and real-world work, then the final project.
- Cover everything in the advertised roadmap above across the levels, in a sensible teaching order.
- Reply with JSON only, no commentary.`;
};

const planLine = (language: any, slot: any) => {
  if (slot.kind === 'a') {
    return `- kind "a": type "multiple_choice", difficulty ${slot.difficulty}. Give four options in "options"; exactly one is right and the other three are plausible traps. "expected_output" is that correct option's text, "starter_code" is empty.`;
  }
  if (slot.kind === 'b') {
    return `- kind "b": type "predict_output", difficulty ${slot.difficulty}. Give a short ${language.name} snippet of three to eight lines in the problem text and in "starter_code"; the student predicts exactly what it prints. "expected_output" is that output character for character, and the first test case's "input" is the snippet.`;
  }
  if (AUTO_GRADED.includes(slot.type)) {
    const start = slot.type === 'fix_bug'
      ? 'Give a snippet with one clear bug in "starter_code" and in the problem text; "answer" is the whole corrected snippet.'
      : 'Give an incomplete snippet in "starter_code" and in the problem text; "answer" is the whole completed snippet.';
    return `- kind "c": type "${slot.type}", difficulty ${slot.difficulty}. ${start} Also list two or three other correct versions of the same snippet in "accepted_answers". "expected_output" is what the corrected ${language.name} code produces.`;
  }
  return `- kind "c": type "${slot.type}", difficulty ${slot.difficulty}. This is a build task and the app does not run student code, so the student builds it, compares the output and marks it built: the problem describes exactly what to build and the rules it must follow, "starter_code" is a starting skeleton, "constraints" hold the hard requirements, "expected_input" and "expected_output" describe the behaviour, and "answer" is a short reference description of a correct implementation.`;
};

const contentPrompt = (language: any, level: any, topics: string[]) => `You are writing the student-facing content for one level of the ${language.name} track on DEVLAUNCH, a free coding-practice platform for engineering students.

TRACK: ${language.name} (${language.slug})
TAGLINE: ${language.tagline || ''}
LEVEL ${level.order} of ${TRACK_LEVELS}: "${level.title}" — ${level.tier} tier
WHAT THIS LEVEL TEACHES: ${level.focus}
TOPICS OF THIS LEVEL: ${topics.join(', ')}

Write EXACTLY ${LESSONS_PER_LEVEL} lessons and EXACTLY ${CHALLENGES_PER_LEVEL} challenges for this level and return them as JSON.

LESSONS — one idea per lesson, working through the topics above in order:
- "title": specific and readable, at most 80 characters.
- "summary": one sentence, at most 200 characters.
- "explanation": three to five sentences in plain language for a student who has never used ${language.name} before this level; explain the idea and why it matters. At most 1100 characters.
- "real_world_example": one short paragraph on where this shows up in real software. At most 500 characters.
- "code_example": real, correct ${language.name} code of two to six lines that demonstrates the lesson. Plain code only, no markdown fences.
- "try_it": one instruction the student can follow straight away. At most 300 characters.
- "practice_question": one question with a single definite answer. At most 300 characters.
- "common_mistake": the mistake students really make here, plus the fix. At most 300 characters.
- "hint": a nudge that does not give the answer away. At most 300 characters.
- "solution_explanation": the correct answer and why it is correct. At most 500 characters.
- "mini_challenge": one small thing to build using the lesson. At most 300 characters.

CHALLENGES — exactly ${CHALLENGES_PER_LEVEL}, in this order, each carrying its own "kind":
${planFor(level.order).map((slot) => planLine(language, slot)).join('\n')}

Rules for every challenge:
- "topic" must be one of: ${topics.join(', ')}. Never invent a new topic name.
- "problem": the complete task, at most 900 characters, including any code snippet.
- "expected_input" and "expected_output": plain words, "None" when there is no input.
- "constraints": one line, at most 300 characters.
- "example": one tiny worked example, at most 500 characters.
- "test_cases": one or two entries of { "input": "...", "expected_output": "...", "visible": true }.
- "hints": exactly three hints, each at most 300 characters, going from a nudge to a near answer; none of them may be the answer itself.
- "answer": the correct answer. For a multiple-choice challenge it must be copied exactly from "options"; for a predict-output challenge it must be the exact output.
- "accepted_answers": two to four equivalent ways of writing that same correct answer, including the answer itself, so a student is never marked wrong over spacing or capitalisation.
- "explanation": why the correct answer is right, at most 500 characters.

Keep the whole response under 7000 characters. Reply with JSON only, no commentary.`;

const levelCounts = async (base44: any, slug: string) => {
  const [lessonPage, challengePage] = await Promise.all([
    base44.entities.Lesson.filter({ language_slug: slug }, { limit: 200, fields: ['level_order'] }),
    base44.entities.CodingChallenge.filter({ language_slug: slug }, { limit: 200, fields: ['level_order'] })
  ]);
  const counts = new Map<string, any>();
  const bump = (order: any, key: string) => {
    const id = String(num(order, 0));
    const entry = counts.get(id) || { lessons: 0, challenges: 0 };
    entry[key] += 1;
    counts.set(id, entry);
  };
  (lessonPage.items || []).forEach((row: any) => bump(row.level_order, 'lessons'));
  (challengePage.items || []).forEach((row: any) => bump(row.level_order, 'challenges'));
  return counts;
};

const isLevelWhole = (counts: Map<string, any>, order: number) => {
  const entry = counts.get(String(order)) || { lessons: 0, challenges: 0 };
  return entry.lessons >= LESSONS_PER_LEVEL && entry.challenges >= CHALLENGES_PER_LEVEL;
};

// A level half-written by an interrupted run is discarded rather than skipped, so a retry can
// never leave a level with one lesson and no challenges.
const clearLevel = async (base44: any, slug: string, order: number) => {
  const challenges = (await base44.entities.CodingChallenge.filter(
    { language_slug: slug, level_order: order },
    { limit: 20, fields: ['id'] }
  )).items || [];
  const ids = challenges.map((row: any) => row.id);
  if (ids.length) {
    await base44.entities.ChallengeSolution.deleteMany({ challenge_id: { $in: ids } });
    await base44.entities.CodingChallenge.deleteMany({ id: { $in: ids } });
  }
  await base44.entities.Lesson.deleteMany({ language_slug: slug, level_order: order });
};

const buildLevelMap = async (base44: any, language: any, levels: any[]) => {
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: levelMapPrompt(language),
    response_json_schema: LEVEL_MAP_SCHEMA
  });
  const map = sanitizeLevels(result?.levels);
  if (map.length < 8) throw new Error('The level map came back incomplete');
  if (!map.some((level: any) => level.order === TRACK_LEVELS)) {
    map.push({ order: TRACK_LEVELS, title: `Final Boss — Build a Real ${language.name} Project`, tier: 'Expert', focus: 'Plan, build, test and ship something real.', topics: ['Planning', 'Building', 'Testing'] });
  }
  await base44.entities.ProgrammingLanguage.update(language.id, { levels: map });
  return map;
};

const buildLevel = async (base44: any, language: any, level: any) => {
  const plan = planFor(level.order);
  const topics = (Array.isArray(level.topics) ? level.topics : []).filter(Boolean);
  const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: contentPrompt(language, level, topics),
    response_json_schema: CONTENT_SCHEMA
  });

  const lessons = (Array.isArray(result?.lessons) ? result.lessons : [])
    .slice(0, LESSONS_PER_LEVEL)
    .map((lesson: any, index: number) =>
      sanitizeLesson({
        ...lesson,
        language_slug: language.slug,
        level_order: level.order,
        order: index + 1,
        xp_reward: 20,
        published: true
      })
    )
    .filter((lesson: any) => lesson.title);
  if (lessons.length < LESSONS_PER_LEVEL) throw new Error('The lessons for this level came back incomplete');

  const byKind: any = {};
  (Array.isArray(result?.challenges) ? result.challenges : []).forEach((challenge: any, index: number) => {
    const kind = ['a', 'b', 'c'].includes(challenge?.kind) ? challenge.kind : ['a', 'b', 'c'][index];
    if (kind && !byKind[kind]) byKind[kind] = challenge;
  });

  const slots = plan
    .map((slot: any) => {
      const raw: any = byKind[slot.kind] || {};
      return {
        row: sanitizeChallenge({
          ...raw,
          type: slot.type,
          difficulty: slot.difficulty,
          xp_reward: slot.xp,
          topic: topics.includes(raw.topic) ? raw.topic : topics[0] || '',
          language_slug: language.slug,
          level_order: level.order,
          published: true
        }),
        answer: text(raw.answer, 2000),
        accepted: Array.isArray(raw.accepted_answers)
          ? raw.accepted_answers.filter((value: any) => typeof value === 'string').map((value: string) => value.slice(0, 2000)).slice(0, 6)
          : [],
        explanation: text(raw.explanation, 2000)
      };
    })
    .filter((slot: any) => slot.row.title && slot.row.problem);
  if (slots.length < CHALLENGES_PER_LEVEL) throw new Error('The challenges for this level came back incomplete');

  const createdLessons = await base44.entities.Lesson.bulkCreate(lessons);

  // Challenges are written one at a time because each grading answer has to be attached to the id
  // of the challenge it belongs to.
  const createdChallenges = [];
  for (const slot of slots) {
    const created = await base44.entities.CodingChallenge.create(slot.row);
    createdChallenges.push({ challenge: created, slot });
  }

  const solutions = createdChallenges
    .filter(({ challenge, slot }: any) => AUTO_GRADED.includes(challenge.type) && slot.answer)
    .map(({ challenge, slot }: any) => ({
      challenge_id: challenge.id,
      ...sanitizeSolution({ answer: slot.answer, accepted_answers: slot.accepted, explanation: slot.explanation })
    }));
  if (solutions.length) await base44.entities.ChallengeSolution.bulkCreate(solutions);

  return {
    order: level.order,
    title: level.title,
    lessons: Array.isArray(createdLessons) ? createdLessons.length : lessons.length,
    challenges: createdChallenges.length,
    solutions: solutions.length
  };
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admins only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const slug = text(body?.language_slug, 40).toLowerCase();
    if (!slug) return Response.json({ error: 'A language is required' }, { status: 400 });
    // Each run writes a small batch so one request stays short; the caller repeats it until the
    // track reports complete.
    const count = Math.min(3, Math.max(1, Math.round(num(body?.count, 2))));

    const page = await base44.entities.ProgrammingLanguage.filter({ slug }, { limit: 1 });
    const language = page.items?.[0];
    if (!language) return Response.json({ error: 'Language not found' }, { status: 404 });

    let levels = Array.isArray(language.levels) ? language.levels : [];
    if (levels.length < 2) levels = await buildLevelMap(base44, language, levels);
    levels = levels.sort((a: any, b: any) => num(a.order) - num(b.order));

    const counts = await levelCounts(base44, slug);
    const pending = levels.filter((level: any) => !isLevelWhole(counts, num(level.order, 0)));

    if (!pending.length) {
      if (language.curriculum_status !== 'ready') {
        await base44.entities.ProgrammingLanguage.update(language.id, { curriculum_status: 'ready' });
      }
      return Response.json({ language: slug, levels_total: levels.length, generated: [], pending: [], complete: true });
    }

    const generated = [];
    for (const level of pending.slice(0, count)) {
      if (isLevelWhole(counts, num(level.order, 0))) continue;
      if ((counts.get(String(num(level.order, 0))) || { lessons: 0, challenges: 0 }).lessons > 0) {
        await clearLevel(base44, slug, num(level.order, 0));
      }
      generated.push(await buildLevel(base44, language, level));
    }

    const after = await levelCounts(base44, slug);
    const remaining = levels.filter((level: any) => !isLevelWhole(after, num(level.order, 0))).map((level: any) => num(level.order, 0));
    const complete = remaining.length === 0;
    if (complete) {
      await base44.entities.ProgrammingLanguage.update(language.id, { curriculum_status: 'ready' });
    }

    return Response.json({ language: slug, levels_total: levels.length, generated, pending: remaining, complete });
  } catch (error) {
    return serverError(error);
  }
}