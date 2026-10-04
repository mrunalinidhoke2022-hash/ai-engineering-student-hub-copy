import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normalizeName, normalizeEmail, normalizeMobile, normalizeUsername, validateUsername, nextUserId, findConflicts, findUsernameConflict, rollBackIfLost } from '../../shared/identity.ts';
import { serverError } from '../../shared/http.ts';

// Codes rather than sentence fragments, so the pages can show these in the reader's own language.
const FIELD_CODES = { full_name: 'NAME_TAKEN', email: 'EMAIL_TAKEN', mobile: 'MOBILE_TAKEN' };

// A mobile number counts as verified only when THIS account proved it with an OTP shortly
// before. Read from the server-side record the verification wrote — never from the request,
// which is what stops a client from simply claiming its number is verified.
const VERIFICATION_WINDOW_MINUTES = 60;

const hasVerifiedMobile = async (base44, accountId, mobile) => {
  const page = await base44.asServiceRole.entities.MobileOtp.filter(
    { account_id: accountId, mobile_key: mobile, verified: true },
    { limit: 1, sort: '-verified_at' }
  );
  const record = page.items[0];
  if (!record?.verified_at) return false;
  return Date.now() - new Date(record.verified_at).getTime() < VERIFICATION_WINDOW_MINUTES * 60000;
};

// Runs after the platform has verified the email with the one-time code.
// Creates the identity record (unique name / email / mobile / User ID) for the
// signed-in account, and is safe to call again for the same account.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const fullName = normalizeName(body.full_name);
    const email = normalizeEmail(user.email);
    const mobile = normalizeMobile(body.mobile);
    const photoUrl = typeof body.photo_url === 'string' ? body.photo_url : '';
    const username = normalizeUsername(body.username);

    if (!fullName || !mobile || mobile.length !== 10) {
      return Response.json(
        { error: 'A full name and a valid 10-digit mobile number are required.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }
    if (username && !validateUsername(username)) {
      return Response.json(
        {
          error: 'That User ID cannot be used. Use 3–40 letters, numbers, spaces or hyphens.',
          code: 'INVALID_USERNAME',
        },
        { status: 400 }
      );
    }

    const existing = await base44.asServiceRole.entities.StudentProfile.filter({ account_id: user.id }, { limit: 1 });
    if (existing.items[0]) return Response.json({ profile: existing.items[0], alreadyRegistered: true });

    const conflict = await findConflicts(base44, { fullName, email, mobile });
    if (conflict) {
      return Response.json(
        { error: conflict.message, field: conflict.field, code: FIELD_CODES[conflict.field] },
        { status: 409 }
      );
    }

    if (username && (await findUsernameConflict(base44, username))) {
      return Response.json(
        { error: 'This User ID is already taken. Please choose another one.', code: 'USERNAME_TAKEN' },
        { status: 409 }
      );
    }

    const profile = await base44.asServiceRole.entities.StudentProfile.create({
      account_id: user.id,
      user_id: username || (await nextUserId(base44, fullName)),
      full_name: fullName,
      name_key: normalizeName(fullName).toLowerCase(),
      email,
      email_key: email,
      mobile,
      mobile_key: mobile,
      photo_url: photoUrl,
      email_verified: true,
      mobile_verified: await hasVerifiedMobile(base44, user.id, mobile),
      status: 'active',
      registered_at: new Date().toISOString(),
    });

    const lost = await rollBackIfLost(base44, { fullName, email, mobile }, profile);
    if (lost) {
      return Response.json(
        { error: lost.message, field: lost.field, code: FIELD_CODES[lost.field] },
        { status: 409 }
      );
    }

    // Two students can submit the same User ID at the same moment; the later insert gives way,
    // exactly as it does for the name, email and mobile number above.
    if (username && (await findUsernameConflict(base44, username, profile.id))) {
      await base44.asServiceRole.entities.StudentProfile.delete(profile.id);
      return Response.json(
        { error: 'This User ID was just taken. Please choose another one.', code: 'USERNAME_TAKEN' },
        { status: 409 }
      );
    }

    return Response.json({ profile });
  } catch (error) {
    return serverError(error);
  }
}