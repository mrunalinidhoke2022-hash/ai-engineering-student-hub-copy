import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { throttle } from '../../shared/throttle.ts';
import { serverError } from '../../shared/http.ts';
import { runContentSync } from '../../shared/contentPipeline.ts';

// The content sync. Two ways in:
//
//  * a signed-in admin pressing "Refresh now" or "Retry failed sources";
//  * the daily "Content Sync" workflow, which runs as the app itself and carries no user session,
//    so it cannot prove who it is.
//
// Because that second path cannot be authenticated, it is hard-capped (two runs per 12 hours
// app-wide) and it can only ever stage proposals for admin review — an anonymous caller who
// guesses the shape of the request cannot reach anything the daily schedule would not do anyway,
// cannot publish anything, and cannot make the app fetch a URL that is not an admin-approved
// source. Nothing here writes application code, schema, security rules, secrets or user data.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const scheduled = body?.scheduled_sync === true;

    const user = await base44.auth.me().catch(() => null);

    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admins only.', code: 'FORBIDDEN' }, { status: 403 });
    }

    if (!user) {
      if (!scheduled) return Response.json({ error: 'Sign in required.', code: 'UNAUTHORIZED' }, { status: 401 });
      const guard = await throttle(base44, 'content-sync-schedule', 'global', 2, 43200);
      if (!guard.allowed) {
        return Response.json({ error: 'The sync ran recently. Please try again later.', code: 'TOO_MANY' }, { status: 429 });
      }
    } else {
      const guard = await throttle(base44, 'content-sync-admin', user.id, 4, 900);
      if (!guard.allowed) {
        return Response.json({ error: 'Too many sync requests. Please wait a moment.', code: 'TOO_MANY' }, { status: 429 });
      }
    }

    const result = await runContentSync(base44, {
      trigger: scheduled ? 'schedule' : 'admin',
      actor: user?.email || 'scheduled sync',
      onlyFailed: body?.only_failed === true,
    });

    return Response.json({ trigger: scheduled ? 'schedule' : 'admin', ...result });
  } catch (error) {
    return serverError(error);
  }
}