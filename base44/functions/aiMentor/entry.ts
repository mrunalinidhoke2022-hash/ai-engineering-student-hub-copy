import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { throttle } from '../../shared/throttle.ts';

const MAX_CODE = 4000;
const MAX_SUMMARY = 600;

const REVIEW_SCHEMA = {
  type: 'object',
  properties: {
    has_issues: { type: 'boolean' },
    summary: { type: 'string' },
    issues: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, detail: { type: 'string' } },
        required: ['title', 'detail']
      }
    },
    learning_paths: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, step: { type: 'string' } },
        required: ['title']
      }
    }
  },
  required: ['has_issues', 'summary', 'issues', 'learning_paths']
};

// Reviews one solution: reports real defects, stores the review for that student only,
// bookmarks the problem when there is something to fix, and names what to practise next.
const reviewCode = async (base44: any, body: any): Promise<Response> => {
  const problemId = typeof body?.problem_id === 'string' ? body.problem_id.trim() : '';
  const code = typeof body?.code === 'string' ? body.code.trim().slice(0, MAX_CODE) : '';
  if (!problemId || code.length < 20) {
    return Response.json({ error: 'Add your solution before asking for a review.' }, { status: 400 });
  }

  const problem = await base44.entities.CodingProblem.get(problemId).catch(() => null);
  if (!problem) return Response.json({ error: 'Problem not found' }, { status: 404 });

  const pathPage = await base44.entities.LearningPath.list({ limit: 50, fields: ['title', 'category', 'steps'] });
  const paths = pathPage.items || [];
  const pathText = paths
    .map((path: any) => `- ${path.title} (${path.category}): ${(path.steps || []).map((step: any) => step.title).join(' | ')}`)
    .join('\n');

  const prompt = `You are a patient programming mentor reviewing one solution from a beginner engineering student on the "DEVLAUNCH" platform.

Problem: ${problem.title} (${problem.language} · ${problem.topic} · ${problem.difficulty})
Problem statement:
${problem.problem}

Student's code (${problem.language}):
"""
${code}
"""

Check whether the code really solves the stated problem, and look for genuine defects: wrong logic, missing edge cases, off-by-one errors, or anything that would stop it running. Ignore style, naming and formatting preferences.
- has_issues: true when there is at least one real defect to fix, false when the solution is correct
- summary: 2-3 encouraging sentences in plain language, no jargon
- issues: at most 4 items, each { title: short label for the defect, detail: what goes wrong and how to fix it, at most 2 sentences }; empty array when there are none
- learning_paths: at most 2 entries from the list below that would fix the specific weakness, each { title: exact path title from the list, step: exact step title from that path }; empty array when nothing fits

Available learning paths:
${pathText || '(none available)'}`;

  const review = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    response_json_schema: REVIEW_SCHEMA
  });

  // Only learning paths that really exist in the app are offered back to the student.
  const pathByTitle = new Map(paths.map((path: any) => [String(path.title).toLowerCase(), path]));
  const learningPaths = (Array.isArray(review.learning_paths) ? review.learning_paths : [])
    .map((suggestion: any) => {
      const path = pathByTitle.get(String(suggestion?.title || '').toLowerCase());
      if (!path) return null;
      const step = (path.steps || []).find(
        (candidate: any) => String(candidate.title).toLowerCase() === String(suggestion?.step || '').toLowerCase()
      );
      return { title: path.title, step: step ? step.title : '' };
    })
    .filter(Boolean)
    .slice(0, 2);

  const issues = (Array.isArray(review.issues) ? review.issues : [])
    .slice(0, 4)
    .map((issue: any) => ({ title: String(issue?.title || 'Issue'), detail: String(issue?.detail || '') }));
  const hasIssues = Boolean(review.has_issues) && issues.length > 0;
  const summary = String(review.summary || '').slice(0, MAX_SUMMARY);

  const record = await base44.entities.CodeReview.create({
    problem_id: problem.id,
    problem_title: problem.title,
    language: problem.language,
    code,
    has_issues: hasIssues,
    summary,
    issues,
    learning_paths: learningPaths,
    reviewed_at: new Date().toISOString()
  });

  if (hasIssues) {
    // Keep the problem in the student's toolkit so they can come back to it.
    const existing = await base44.entities.Bookmark.filter(
      { item_type: 'coding_problem', item_id: problem.id },
      { limit: 1 }
    );
    if (!existing.items?.length) {
      await base44.entities.Bookmark.create({
        item_type: 'coding_problem',
        item_id: problem.id,
        item_name: problem.title,
        folder: 'Coding'
      });
    }
  }

  return Response.json({
    id: record.id,
    created_date: record.created_date,
    problem_id: problem.id,
    problem_title: problem.title,
    has_issues: hasIssues,
    summary,
    issues,
    learning_paths: learningPaths
  });
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Every call costs a paid LLM call, so one account is capped per hour: enough for a
    // real study session, far short of what a script would need to drain the app's credits.
    const limit = await throttle(base44, 'ai-mentor', user.id, 40, 3600);
    if (!limit.allowed) {
      return Response.json(
        { error: 'You have reached the mentor limit for now. Please try again a little later.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    if (body?.mode === 'code_review') return await reviewCode(base44, body);

    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 500) : '';
    const history = Array.isArray(body?.history) ? body.history.slice(-6) : [];
    if (!message) return Response.json({ error: 'Message is required' }, { status: 400 });

    const historyText = history
      .map((h: any) => `${h.role === 'user' ? 'Student' : 'Mentor'}: ${String(h.content || '').slice(0, 300)}`)
      .join('\n');

    const prompt = `You are a friendly, encouraging AI Engineering Mentor for beginner engineering students on the "AI & Engineering Student Hub" platform.
Guide the student step-by-step. NEVER dump a huge wall of text — keep the main response short (3-5 sentences), beginner-friendly, and avoid unexplained jargon.
Always end by giving 2-4 concrete next steps and, when relevant, 1-3 resource suggestions (tool names or topics to search for on this platform, like "AI Tools directory", "Coding Practice", "Hackathon Hub").

Conversation so far:
${historyText || '(this is the first message)'}

Student's new message: "${message}"`;

    const schema = {
      type: 'object',
      properties: {
        response: { type: 'string' },
        next_steps: { type: 'array', items: { type: 'string' } },
        resources: { type: 'array', items: { type: 'string' } }
      },
      required: ['response', 'next_steps']
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}