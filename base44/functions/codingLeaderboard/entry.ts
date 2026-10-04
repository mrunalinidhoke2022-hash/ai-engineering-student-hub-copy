import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const TOP_N = 20;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Progress rows are private to their owner, so the ranking is computed with the
    // service role. Only the public fields (name, solved count, language) are returned.
    const ranking = await base44.asServiceRole.entities.Progress.aggregate({
      query: { item_type: 'coding_problem', status: 'completed' },
      groupBy: 'created_by_id',
      sort: '-count',
      limit: TOP_N
    });

    const rows = (ranking.rows || []).filter((row) => row.created_by_id);
    if (rows.length === 0) return Response.json({ entries: [] });

    const userIds = rows.map((row) => row.created_by_id);

    const [users, solvedRows] = await Promise.all([
      base44.asServiceRole.entities.User.filter({ id: { $in: userIds } }, { fields: ['full_name'] }),
      base44.asServiceRole.entities.Progress.filter(
        { item_type: 'coding_problem', status: 'completed', created_by_id: { $in: userIds } },
        { fields: ['created_by_id', 'item_id'], limit: 1000 }
      )
    ]);

    // Language lives on the problem, not on the progress row, so the badge needs this join.
    const problemIds = [...new Set(solvedRows.items.map((row) => row.item_id).filter(Boolean))];
    const problems = problemIds.length
      ? await base44.asServiceRole.entities.CodingProblem.filter({ id: { $in: problemIds } }, { fields: ['language'], limit: 1000 })
      : { items: [] };
    const languageById = new Map(problems.items.map((problem) => [problem.id, problem.language]));

    const languageCounts = new Map();
    solvedRows.items.forEach((row) => {
      const language = languageById.get(row.item_id);
      if (!language) return;
      const counts = languageCounts.get(row.created_by_id) || new Map();
      counts.set(language, (counts.get(language) || 0) + 1);
      languageCounts.set(row.created_by_id, counts);
    });

    const nameById = new Map(users.items.map((record) => [record.id, record.full_name]));

    const entries = rows.map((row, index) => {
      const counts = languageCounts.get(row.created_by_id);
      const topLanguage = counts ? [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0] : null;
      return {
        rank: index + 1,
        user_id: row.created_by_id,
        name: nameById.get(row.created_by_id) || 'Student',
        solved: row.count,
        language: topLanguage
      };
    });

    return Response.json({ entries });
  } catch (error) {
    return Response.json({ error: 'Failed to load the leaderboard' }, { status: 500 });
  }
}