import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
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