import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normalizeName, normalizeMobile, findConflicts } from '../../shared/identity.ts';
import { serverError } from '../../shared/http.ts';

// Student-editable identity details. Name and mobile changes are re-validated for
// uniqueness here, because the client can't be trusted to enforce that.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const page = await base44.asServiceRole.entities.StudentProfile.filter({ account_id: user.id }, { limit: 1 });
    const profile = page.items[0];
    if (!profile) return Response.json({ error: 'No student profile found for this account.' }, { status: 404 });

    const body = await req.json();
    const fullName = body.full_name ? normalizeName(body.full_name) : profile.full_name;
    const mobile = body.mobile ? normalizeMobile(body.mobile) : profile.mobile;

    if (!fullName || mobile.length !== 10) {
      return Response.json({ error: 'A full name and a valid 10-digit mobile number are required.' }, { status: 400 });
    }

    const changed = fullName.toLowerCase() !== profile.name_key || mobile !== profile.mobile_key;
    if (changed) {
      const conflict = await findConflicts(base44, { fullName, email: profile.email, mobile }, profile.id);
      if (conflict) return Response.json({ error: conflict.message, field: conflict.field }, { status: 409 });
    }

    const updated = await base44.asServiceRole.entities.StudentProfile.update(profile.id, {
      full_name: fullName,
      name_key: fullName.toLowerCase(),
      mobile,
      mobile_key: mobile,
      mobile_verified: mobile === profile.mobile_key ? profile.mobile_verified : false,
      photo_url: typeof body.photo_url === 'string' && body.photo_url ? body.photo_url : profile.photo_url,
    });

    return Response.json({ profile: updated });
  } catch (error) {
    return serverError(error);
  }
}