import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { serverError } from '../../shared/http.ts';
import { appendEvent, cleanText, diffFields, loadSettings, publishProposal, sanitizeFields } from '../../shared/contentPipeline.ts';

// Every decision an admin makes about a staged content update goes through here: edit the proposed
// values, mark it verified, publish it to the site, reject it, or reopen a rejected one.
//
// Admin only. Editing is filtered through the same field allowlist the pipeline uses, so a manual
// edit cannot introduce a field the pipeline itself could not propose. Publishing is the only path
// that writes real content, and it can only write a Tool record's documented fields or an
// Announcement — never code, schema, permissions or accounts.

const ACTIONS = ['save', 'verify', 'publish', 'reject', 'reopen'];

const parse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (!user) return Response.json({ error: 'Sign in required.', code: 'UNAUTHORIZED' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admins only.', code: 'FORBIDDEN' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = ACTIONS.includes(body?.action) ? body.action : '';
    if (!action) return Response.json({ error: 'Unknown action.', code: 'INVALID_INPUT' }, { status: 400 });

    const store = base44.asServiceRole.entities.ContentUpdate;
    const current = body?.id ? await store.get(String(body.id)).catch(() => null) : null;
    if (!current) return Response.json({ error: 'That update is no longer in the queue.', code: 'NOT_FOUND' }, { status: 404 });
    if (current.status === 'published' && action !== 'reopen') {
      return Response.json({ error: 'That update is already published.', code: 'ALREADY_PUBLISHED' }, { status: 409 });
    }
    // A rejection is a decision, not a pause: it has to be reopened before it can be published.
    if (current.status === 'rejected' && (action === 'publish' || action === 'verify')) {
      return Response.json({ error: 'Reopen this update before deciding on it again.', code: 'REJECTED' }, { status: 409 });
    }

    const actor = cleanText(user.full_name || user.email || 'admin', 160);
    const note = cleanText(body?.note, 400);
    const now = new Date().toISOString();

    if (action === 'save') {
      const fields = sanitizeFields(body?.fields);
      const previous = parse(current.previous_value, {});
      await store.update(current.id, {
        proposed: JSON.stringify(fields).slice(0, 3000),
        changes: diffFields(previous, fields),
        reviewed_by: actor,
        review_note: note,
        events: appendEvent(current.events, { at: now, by: actor, action: 'edited', note }),
      });
      return Response.json({ ok: true, saved: Object.keys(fields).length });
    }

    if (action === 'reject') {
      await store.update(current.id, {
        status: 'rejected',
        reviewed_at: now,
        reviewed_by: actor,
        review_note: note,
        events: appendEvent(current.events, { at: now, by: actor, action: 'rejected', note }),
      });
      return Response.json({ ok: true });
    }

    if (action === 'verify') {
      await store.update(current.id, {
        status: 'verified',
        verified_at: now,
        reviewed_at: now,
        reviewed_by: actor,
        review_note: note,
        events: appendEvent(current.events, { at: now, by: actor, action: 'verified', note }),
      });
      return Response.json({ ok: true });
    }

    if (action === 'reopen') {
      await store.update(current.id, {
        status: 'needs_review',
        review_note: note,
        events: appendEvent(current.events, { at: now, by: actor, action: 'reopened', note }),
      });
      return Response.json({ ok: true });
    }

    // publish — the edits made in the review dialog are saved first, so what the admin sees on
    // screen is exactly what reaches the site.
    const fields = sanitizeFields(body?.fields ?? parse(current.proposed, {}));
    const previous = parse(current.previous_value, {});
    await store.update(current.id, {
      proposed: JSON.stringify(fields).slice(0, 3000),
      changes: diffFields(previous, fields),
      review_note: note,
    });

    const fresh = await store.get(current.id);
    const settings = await loadSettings(base44);
    const result = await publishProposal(base44, fresh, {
      actor,
      notify: settings.notify_students !== false,
      note,
    });

    if (!result.ok) {
      return Response.json({ error: result.error || 'That update could not be published.', code: 'PUBLISH_FAILED' }, { status: 400 });
    }

    return Response.json({ ok: true, applied: result.applied });
  } catch (error) {
    return serverError(error);
  }
}