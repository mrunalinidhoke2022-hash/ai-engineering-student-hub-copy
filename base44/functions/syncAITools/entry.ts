import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { throttle } from '../../shared/throttle.ts';
import { serverError } from '../../shared/http.ts';
import { runContentSync, scheduleIsDue } from '../../shared/contentPipeline.ts';

// The content sync. Two ways in:
//
//  * a signed-in admin pressing "Refresh now" or "Retry failed sources";
//  * the daily "Content Sync" workflow, which runs as the app itself and carries no user session,
//    so the request cannot prove where it came from and its body cannot be trusted as permission.
//
// A session-less call is closed to everyone but the workflow: it has to present the scheduled-sync
// key before anything runs, and even then it is served only while the schedule is genuinely due
// (scheduleIsDue) and stays hard-capped at two runs per 12 hours app-wide. A stranger who reaches
// this URL gets nothing back and spends nothing. Whatever does run can only ever stage proposals
// for admin review, cannot publish anything, and cannot make the app fetch a URL that is not an
// admin-approved source. Nothing here writes application code, schema, security rules, secrets or
// user data.
// The key the daily workflow presents. The function's URL is public and its body is whatever the
// caller sent, so a call carrying no signed-in user has to prove it is that scheduled run before it
// may fetch feeds, spend model credits or write proposals. The key itself sits in the workflow
// definition — workflows cannot read stored secrets — and only its SHA-256 is kept here, so this
// file holds nothing usable on its own. To rotate: put a fresh key in the workflow, replace the hash.
const SCHEDULED_SYNC_KEY_HASH = 'c4a5ead034b801d1a0e2cfc9eeaa07a99010c6242ee5c86f0ec0dbd719a2e420';

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const user = await base44.auth.me().catch(() => null);

    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Admins only.', code: 'FORBIDDEN' }, { status: 403 });
    }

    // No session means the daily workflow. The body is not taken as permission — the schedule's own
    // state decides whether there is anything to do, so no caller can trigger a run early or extra.
    const scheduled = !user;

    if (scheduled) {
      const presented = String(body?.sync_key || '');
      if (!presented || (await sha256(presented)) !== SCHEDULED_SYNC_KEY_HASH) {
        return Response.json({ error: 'This sync has to come from the app itself.', code: 'UNAUTHORIZED' }, { status: 401 });
      }
      if (!(await scheduleIsDue(base44))) {
        return Response.json({
          trigger: 'schedule',
          skipped: 'not_due',
          summary: 'Every source was checked recently — nothing is due yet.'
        });
      }
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
      // A retry deliberately skips the interval check, so only a signed-in admin may ask for one.
      onlyFailed: scheduled ? false : body?.only_failed === true,
    });

    return Response.json({ trigger: scheduled ? 'schedule' : 'admin', ...result });
  } catch (error) {
    return serverError(error);
  }
}