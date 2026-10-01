// Server-side throttling for the two public, pre-login endpoints (checkIdentity and
// loginWithIdentifier). Those two must stay callable before an account exists, so
// instead of trusting the caller they are rate limited here.
//
// Counters live in the RequestThrottle entity and are keyed by a salted hash, so no IP
// address and no identity value (email, mobile) is ever stored.

const hashKey = async (value) => {
  const bytes = new TextEncoder().encode(`engineering-hub:${value}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

// Best-effort caller address. Students on one campus network share a public address,
// so the per-address limit is deliberately generous.
export const clientIp = (req) => {
  const forwarded = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
  return forwarded.split(',')[0].trim() || 'unknown';
};

// Records one attempt and reports whether the caller is still inside the limit.
export const throttle = async (base44, bucket, value, limit, windowSeconds) => {
  const keyHash = await hashKey(`${bucket}:${value}`);
  const windowMs = windowSeconds * 1000;
  const now = Date.now();

  const page = await base44.asServiceRole.entities.RequestThrottle.filter(
    { key_hash: keyHash },
    { limit: 1 }
  );
  const record = page.items[0];

  if (!record) {
    await base44.asServiceRole.entities.RequestThrottle.create({
      key_hash: keyHash,
      bucket,
      window_started_at: new Date(now).toISOString(),
      count: 1,
    });
    return { allowed: true };
  }

  const startedAt = new Date(record.window_started_at).getTime();
  const expired = !startedAt || now - startedAt > windowMs;
  const count = record.count || 0;

  if (expired) {
    await base44.asServiceRole.entities.RequestThrottle.update(record.id, {
      window_started_at: new Date(now).toISOString(),
      count: 1,
    });
    return { allowed: true };
  }

  if (count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((windowMs - (now - startedAt)) / 1000) };
  }

  await base44.asServiceRole.entities.RequestThrottle.update(record.id, { count: count + 1 });
  return { allowed: true };
};