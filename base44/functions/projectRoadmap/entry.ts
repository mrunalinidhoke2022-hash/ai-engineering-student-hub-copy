import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { throttle } from '../../shared/throttle.ts';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // A roadmap is one large paid generation, so each account gets only a few per hour —
    // plenty for real planning, but not for a script burning through the credit balance.
    const limit = await throttle(base44, 'project-roadmap', user.id, 6, 3600);
    if (!limit.allowed) {
      return Response.json(
        { error: 'You have generated several roadmaps already. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const idea = typeof body?.idea === 'string' ? body.idea.trim().slice(0, 300) : '';
    if (!idea) return Response.json({ error: 'Project idea is required' }, { status: 400 });

    const prompt = `You are an engineering project mentor helping a beginner student plan a real project.
Project idea: "${idea}"

Create a clear, practical project roadmap for a beginner engineering student. Be specific and realistic, use free/beginner-friendly tools where possible. Keep each text field concise (2-4 sentences) and arrays short (3-6 items).`;

    const schema = {
      type: 'object',
      properties: {
        problem_definition: { type: 'string' },
        target_users: { type: 'string' },
        features: { type: 'array', items: { type: 'string' } },
        tech_stack: { type: 'array', items: { type: 'string' } },
        architecture: { type: 'string' },
        database: { type: 'string' },
        ai_tools: { type: 'array', items: { type: 'string' } },
        apis: { type: 'array', items: { type: 'string' } },
        development_steps: { type: 'array', items: { type: 'string' } },
        testing: { type: 'string' },
        deployment: { type: 'string' },
        documentation: { type: 'string' },
        presentation: { type: 'string' },
        future_scope: { type: 'string' }
      },
      required: ['problem_definition', 'features', 'tech_stack', 'development_steps']
    };

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema
    });

    return Response.json({ idea, ...result });
  } catch (error) {
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}