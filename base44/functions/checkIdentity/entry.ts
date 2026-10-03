import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normalizeName, normalizeEmail, normalizeMobile, findConflicts } from '../../shared/identity.ts';
import { throttle, clientIp } from '../../shared/throttle.ts';
import { serverError } from '../../shared/http.ts';

// Public pre-check run before an account is created: is this name / email / mobile free?
// It runs before sign-in exists, so it cannot verify the caller — it is rate limited
// instead (per connection and per identifier) and returns no recorded identity data.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const fullName = normalizeName(body.full_name);
    const email = normalizeEmail(body.email);
    const mobile = normalizeMobile(body.mobile);

    if (!fullName || !email || !mobile) {
      return Response.json(
        { available: false, message: 'Full name, email address and mobile number are required.' },
        { status: 400 }
      );
    }

    // The yes/no answer itself is the only signal this endpoint can give, so the connection
    // ceiling is what bounds a harvest: a handful of genuine checks per person, not the
    // thousands an address-harvesting script needs. It is counted per connection (one shared
    // bucket when the platform sends no address), so a caller cannot mint fresh buckets.
    const ipLimit = await throttle(base44, 'identity-check-ip', clientIp(req), 25, 3600);
    if (!ipLimit.allowed) {
      return Response.json(
        {
          available: false,
          message: 'Too many checks from this connection. Please wait a while and try again.',
        },
        { status: 429 }
      );
    }

    const emailLimit = await throttle(base44, 'identity-check-email', email, 10, 3600);
    const mobileLimit = await throttle(base44, 'identity-check-mobile', mobile, 10, 3600);
    if (!emailLimit.allowed || !mobileLimit.allowed) {
      return Response.json(
        {
          available: false,
          message: 'These details have been checked too many times. Please wait an hour and try again.',
        },
        { status: 429 }
      );
    }

    const conflict = await findConflicts(base44, { fullName, email, mobile });
    if (conflict) {
      // This check runs before sign-in, so it must not confirm WHICH detail is registered:
      // a per-field answer let a script probe candidate emails, mobiles and names and harvest
      // the app's student list. One generic answer covers every conflict; the verified steps
      // (completeRegistration, updateProfile) still name the exact field to a signed-in user.
      return Response.json({
        available: false,
        message:
          'Some of these details are already registered. Sign in with your registered account, or use different ones.',
      });
    }

    return Response.json({ available: true });
  } catch (error) {
    // Runs before sign-in exists, so the caller is anonymous: the fault is logged for the
    // app owner and only a fixed message goes back (no SDK or storage internals).
    return serverError(error, {
      available: false,
      message: 'Something went wrong. Please try again.',
    });
  }
}