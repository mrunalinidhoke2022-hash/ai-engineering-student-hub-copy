import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normalizeMobile } from '../../shared/identity.ts';
import { throttle, clientIp } from '../../shared/throttle.ts';

// Sign-in for students who use their mobile number or generated User ID instead of their email.
// This runs before sign-in exists, so it cannot identify the caller: it verifies the password
// itself, and the only successful response is a session token — the account email is never
// returned. An unknown identifier and a wrong password both answer with the same message, so
// the endpoint cannot be used to work out who is registered.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const identifier = (body.identifier || '').trim();
    const password = typeof body.password === 'string' ? body.password : '';

    if (!identifier || !password) {
      return Response.json(
        { error: 'Enter your mobile number or User ID and your password.' },
        { status: 400 }
      );
    }
    if (identifier.includes('@')) {
      return Response.json({ error: 'Sign in with your email address and password.' }, { status: 400 });
    }

    const ipLimit = await throttle(base44, 'login-identifier-ip', clientIp(req), 60, 600);
    if (!ipLimit.allowed) {
      return Response.json(
        { error: 'Too many login attempts from this connection. Please wait a few minutes and try again.' },
        { status: 429 }
      );
    }

    // The lockout key must be the SAME normalized value the lookup below uses. Keying it on the
    // raw input let every formatting variant of one account ('98765 43210', '+919876543210',
    // '09876543210', different User-ID casing) open its own fresh 10-attempt bucket, so the
    // per-account limit could be bypassed indefinitely.
    const mobileKey = normalizeMobile(identifier);
    const identifierKey = mobileKey.length === 10 ? mobileKey : identifier.toUpperCase();

    const idLimit = await throttle(base44, 'login-identifier', identifierKey, 10, 900);
    if (!idLimit.allowed) {
      return Response.json(
        { error: 'Too many attempts for this account. Please wait 15 minutes and try again.' },
        { status: 429 }
      );
    }

    const invalid = { error: 'Invalid mobile number / User ID or password.' };
    const fields = ['email', 'status'];
    let profile = null;

    if (mobileKey.length === 10) {
      const byMobile = await base44.asServiceRole.entities.StudentProfile.filter(
        { mobile_key: mobileKey },
        { limit: 1, fields }
      );
      profile = byMobile.items[0] || null;
    }
    if (!profile) {
      const byUserId = await base44.asServiceRole.entities.StudentProfile.filter(
        { user_id: identifier.toUpperCase() },
        { limit: 1, fields }
      );
      profile = byUserId.items[0] || null;
    }
    if (!profile) return Response.json(invalid, { status: 401 });

    let session = null;
    try {
      session = await base44.auth.loginViaEmailPassword(profile.email, password);
    } catch (error) {
      session = null;
    }
    if (!session || !session.access_token) return Response.json(invalid, { status: 401 });

    if (profile.status !== 'active') {
      return Response.json(
        { error: 'This account is not active. Please contact the administrator.' },
        { status: 403 }
      );
    }

    return Response.json({ access_token: session.access_token });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}