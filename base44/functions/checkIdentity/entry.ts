import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normalizeName, normalizeEmail, normalizeMobile, normalizeUsername, validateUsername, findNameConflict, findUsernameConflict } from '../../shared/identity.ts';
import { throttle, clientIp } from '../../shared/throttle.ts';
import { serverError } from '../../shared/http.ts';

// Public pre-check run before an account is created: is this full name still free?
// It runs before sign-in exists, so it cannot verify the caller — it is rate limited
// instead (per connection and per submitted identifier) and answers only about the name.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const fullName = normalizeName(body.full_name);
    const email = normalizeEmail(body.email);
    const mobile = normalizeMobile(body.mobile);
    const username = normalizeUsername(body.username);

    if (!fullName || !email || !mobile) {
      return Response.json(
        { available: false, message: 'Full name, email address and mobile number are required.' },
        { status: 400 }
      );
    }

    if (username && !validateUsername(username)) {
      return Response.json(
        {
          available: false,
          field: 'username',
          code: 'INVALID_USERNAME',
          message: 'That User ID cannot be used. Use 3–40 letters, numbers, spaces or hyphens.',
        },
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

    // Only the name is compared — see findNameConflict. The submitted email and mobile number
    // are still required and still counted, but they never decide the answer: comparing them
    // here let anyone send a throwaway name and number alongside a candidate address and read
    // that address's registration status off the yes/no reply. Email and mobile duplicates are
    // still refused, with the exact field named, by completeRegistration and updateProfile,
    // which only run for a signed-in caller.
    const nameConflict = await findNameConflict(base44, fullName);
    if (nameConflict) {
      return Response.json({
        available: false,
        field: 'name',
        code: 'NAME_TAKEN',
        message:
          'This name is already registered. Sign in with your registered account, or use a different name.',
      });
    }

    // The User ID is answered for, and the email and mobile number are not: the User ID is a
    // public handle — teammates search by it and it can be used to sign in — so a student who
    // has already taken one must be told, while "is this address registered?" stays unanswerable
    // to anyone who has not proved they own the account. See findNameConflict.
    if (username) {
      const usernameConflict = await findUsernameConflict(base44, username);
      if (usernameConflict) {
        return Response.json({
          available: false,
          field: 'username',
          code: 'USERNAME_TAKEN',
          message: 'This User ID is already taken. Please choose another one.',
        });
      }
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