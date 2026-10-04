// Server-side throttling for the two public, pre-login endpoints (checkIdentity and
// loginWithIdentifier). Those two must stay callable before an account exists, so
// instead of trusting the caller they are rate limited here.
//
// Counters live in the RequestThrottle entity and are keyed by a salted hash, so no IP
// address and no identity value (email, mobile) is ever stored.

import { secrets } from 'base44:runtime';

// The salt never lives in the source: a literal committed here would let anyone who reads the
// app's code brute-force candidate emails and mobile numbers against the hashes stored in
// RequestThrottle. When the dedicated secret is not set the app's own id is used instead, so
// these pre-login endpoints keep working rather than failing closed on a missing secret.
const saltMaterial = () => {
  try {
    return secrets.get('THROTTLE_SALT') || secrets.get('BASE44_APP_ID') || 'local';
  } catch {
    return 'local';
  }
};

const hashKey = async (value) => {
  const bytes = new TextEncoder().encode(`${saltMaterial()}:${value}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

// Caller address used as a rate-limit key, taken only from the header the platform's own edge sets
// (it overwrites anything a caller sends). x-forwarded-for and x-real-ip are ordinary request
// headers a caller can put any value in: reading one would let a brute-force caller hand in a fresh
// key per request and walk straight past these limits, so neither is ever read. When no trusted
// address is present the caller joins one shared anonymous bucket instead of picking its own key.
// Students on one campus network share a public address, so the limit stays generous.
export const clientIp = (req) => {
  const platformAddress = req.headers.get('cf-connecting-ip') || '';
  return platformAddress.trim() || 'unknown';
};

// Records one attempt and reports whether the caller is still inside the limit. The window is
// rolled and the count is raised with single conditional writes, and the very first hit for a
// key charges the whole parallel burst to one row, so parallel requests can never undercount
// their way past the limit — neither once a counter exists nor while it is first being created.
export const throttle = async (base44, bucket, value, limit, windowSeconds) => {
  const keyHash = await hashKey(`${bucket}:${value}`);
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const counters = base44.asServiceRole.entities.RequestThrottle;

  // Sorted read: every request for a key settles on the same (oldest) row, so a leftover
  // duplicate row can never hand out a second, parallel budget.
  const page = await counters.filter({ key_hash: keyHash }, { sort: 'created_date', limit: 1 });
  const record = page.items[0];

  if (!record) {
    await counters.create({
      key_hash: keyHash,
      bucket,
      window_started_at: new Date(now).toISOString(),
      count: 1,
    });

    // Parallel requests for a key that had no counter yet all reach this point before any row
    // exists, so more than one row can be created for it. Collapse them onto the oldest row and
    // charge the whole burst to it: without this each parallel request would buy its own free
    // attempt and a concurrent burst could walk straight past the limit.
    const created = (await counters.filter({ key_hash: keyHash }, { sort: 'created_date', limit: 50 })).items || [];
    if (created.length > 1) {
      await counters.deleteMany({ id: { $in: created.slice(1).map((row) => row.id) } });
      const charged = await counters.updateMany(
        { id: created[0].id, count: { $lt: limit } },
        { $inc: { count: created.length - 1 } }
      );
      if (!charged?.updated) return { allowed: false, retryAfterSeconds: windowSeconds };
    }

    return { allowed: true };
  }

  const startedAt = new Date(record.window_started_at).getTime();

  if (!startedAt || now - startedAt > windowMs) {
    // Roll the window; a request that loses the race simply counts against the new one.
    const rolled = await counters.updateMany(
      { key_hash: keyHash, window_started_at: record.window_started_at },
      { $set: { window_started_at: new Date(now).toISOString(), count: 1 } }
    );
    if (rolled?.updated) return { allowed: true };
  }

  // One attempt is only counted while the window is still open and under the limit.
  const bumped = await counters.updateMany(
    { key_hash: keyHash, count: { $lt: limit } },
    { $inc: { count: 1 } }
  );
  if (bumped?.updated) return { allowed: true };

  return {
    allowed: false,
    retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - startedAt)) / 1000)),
  };
};