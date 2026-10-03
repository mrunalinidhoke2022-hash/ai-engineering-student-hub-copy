import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { throttle } from '../../shared/throttle.ts';

// Called by the "On App Publish" workflow every time a new version goes live.
// Recipients are the app's own admins (resolved server-side), so the caller can
// never choose who gets emailed.
//
// The workflow runs as the app itself and carries no user session, so a role check
// cannot gate this endpoint — and like every backend function its URL is reachable by
// anyone. It is therefore refused without a publish event, deduplicated per publish, and
// hard-capped globally, so an anonymous caller cannot loop it into a mailbox flood.

const VISIBILITY_LABELS = {
  private_with_login: 'Private — invited users only',
  workspace_with_login: 'Workspace members only',
  public_with_login: 'Public — login required',
  public_without_login: 'Public — no login required',
};

const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const isYes = (value) => value === true || value === 'true';

const formatWhen = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return 'just now';
  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const publishedAt = clean(body.published_at, 40);
    const visibility = clean(body.visibility, 40);
    const firstPublish = isYes(body.is_first_publish);

    // Only a request that actually describes a publish is served; a bare invocation is refused.
    if (!publishedAt && !visibility && body.is_first_publish === undefined) {
      return Response.json({ error: 'A publish event is required.' }, { status: 400 });
    }

    // At most 5 notifications per 15 minutes app-wide, and never twice for one publish event
    // (a retry of the same event sends nothing; an event with no timestamp falls back to a
    // 10-minute bucket so a notification is never permanently suppressed).
    const globalLimit = await throttle(base44, 'app-publish-notify', 'global', 5, 900);
    if (!globalLimit.allowed) {
      return Response.json({ error: 'Too many publish notifications. Try again later.' }, { status: 429 });
    }

    const eventKey = publishedAt || `unset-${Math.floor(Date.now() / 600000)}`;
    const eventLimit = await throttle(base44, 'app-publish-notify-event', eventKey, 1, 3600);
    if (!eventLimit.allowed) {
      return Response.json({ notified: 0, message: 'This publish was already announced.' });
    }

    const users = await base44.asServiceRole.entities.User.list();
    const recipients = [...new Set((users || []).filter((user) => user.role === 'admin').map((user) => user.email).filter(Boolean))];
    if (!recipients.length) {
      return Response.json({ notified: 0, message: 'No admins to notify yet.' });
    }

    const when = formatWhen(publishedAt);
    const visibilityLabel = VISIBILITY_LABELS[visibility] || 'Not set';
    const subject = firstPublish ? 'Your app is live' : 'A new version of your app is live';

    const html = `
      <div style="font-family: ui-sans-serif, system-ui, sans-serif; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">${firstPublish ? 'Your app is live' : 'A new version is live'}</h2>
        <p style="margin: 0 0 8px;">The app was published on <strong>${when}</strong> (IST).</p>
        <p style="margin: 0 0 8px;">Visibility: <strong>${visibilityLabel}</strong></p>
        <p style="margin: 0;">${firstPublish ? 'This was the very first publish.' : 'This publish replaced the previous version.'}</p>
      </div>
    `;

    let notified = 0;
    for (const email of recipients) {
      await base44.asServiceRole.integrations.Core.SendEmail({ to: email, subject, html });
      notified += 1;
    }

    return Response.json({ notified });
  } catch {
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}