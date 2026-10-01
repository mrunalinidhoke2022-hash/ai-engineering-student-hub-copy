import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normalizeName, normalizeEmail, normalizeMobile, nextUserId, findConflicts, rollBackIfLost } from '../../shared/identity.ts';

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

    if (!fullName || !mobile || mobile.length !== 10) {
      return Response.json({ error: 'A full name and a valid 10-digit mobile number are required.' }, { status: 400 });
    }

    const existing = await base44.asServiceRole.entities.StudentProfile.filter({ account_id: user.id }, { limit: 1 });
    if (existing.items[0]) return Response.json({ profile: existing.items[0], alreadyRegistered: true });

    const conflict = await findConflicts(base44, { fullName, email, mobile });
    if (conflict) return Response.json({ error: conflict.message, field: conflict.field }, { status: 409 });

    const profile = await base44.asServiceRole.entities.StudentProfile.create({
      account_id: user.id,
      user_id: await nextUserId(base44, fullName),
      full_name: fullName,
      name_key: normalizeName(fullName).toLowerCase(),
      email,
      email_key: email,
      mobile,
      mobile_key: mobile,
      photo_url: photoUrl,
      email_verified: true,
      mobile_verified: false,
      status: 'active',
      registered_at: new Date().toISOString(),
    });

    const lost = await rollBackIfLost(base44, { fullName, email, mobile }, profile);
    if (lost) return Response.json({ error: lost.message, field: lost.field }, { status: 409 });

    return Response.json({ profile });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}