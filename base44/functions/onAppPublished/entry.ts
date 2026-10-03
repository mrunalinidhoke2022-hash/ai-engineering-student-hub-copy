import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Called by the "On App Publish" workflow every time a new version goes live.
// Recipients are the app's own admins (resolved server-side), so the caller can
// never choose who gets emailed.

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
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}