import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { throttle } from '../../shared/throttle.ts';
import { serverError } from '../../shared/http.ts';
import { ISSUE_TYPES, cleanText } from '../../shared/contentPipeline.ts';

// A student flagging an entry on a tool page (broken link, wrong price, tool gone, …).
//
// The report goes into the admin review queue as a ContentIssue and is never applied to the tool
// automatically. It is created with the caller's own client, so the record is owned by the student
// and only they and an admin can read it; the tool it names is re-read server-side, so the reporter
// can never attach a report to a name of their choosing. Volume is capped per account.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Sign in required.', code: 'UNAUTHORIZED' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const issueType = ISSUE_TYPES.includes(body?.issue_type) ? body.issue_type : '';
    if (!issueType) return Response.json({ error: 'Choose what is wrong first.', code: 'INVALID_INPUT' }, { status: 400 });

    const toolId = typeof body?.tool_id === 'string' ? body.tool_id.trim().slice(0, 60) : '';
    if (!toolId) return Response.json({ error: 'That tool could not be found.', code: 'NOT_FOUND' }, { status: 404 });

    const limit = await throttle(base44, 'content-report', user.id, 5, 3600);
    if (!limit.allowed) {
      return Response.json({ error: 'Too many reports for now. Please try again later.', code: 'TOO_MANY' }, { status: 429 });
    }

    const tool = await base44.entities.Tool.get(toolId).catch(() => null);
    if (!tool) return Response.json({ error: 'That tool could not be found.', code: 'NOT_FOUND' }, { status: 404 });

    await base44.entities.ContentIssue.create({
      tool_id: tool.id,
      tool_name: cleanText(tool.name, 120),
      tool_slug: cleanText(tool.slug, 80),
      issue_type: issueType,
      message: cleanText(body?.message, 500),
      reporter_name: cleanText(user.full_name || user.email || '', 120),
      status: 'new',
      description: 'Reported by a student from the tool page.',
    });

    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}