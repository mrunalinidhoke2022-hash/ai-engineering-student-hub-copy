import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normalizeMobile, findConflicts } from '../../shared/identity.ts';
import { throttle } from '../../shared/throttle.ts';
import { serverError } from '../../shared/http.ts';
import { hashOtp, sameHash, isExpired, isLocked, secondsLeft, OTP_MAX_ATTEMPTS, OTP_LOCK_SECONDS } from '../../shared/otp.ts';

// Checks a mobile code against the hash stored for the caller's OWN account.
// Every decision is made here: the client can neither mark a number verified nor skip the check,
// and the number only counts as verified once a matching code has actually been spent.

const VERIFIED_WINDOW_MINUTES = 60;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mobile = normalizeMobile(body.mobile);
    const code = String(body.code || '').trim();
    if (mobile.length !== 10 || !/^\d{6}$/.test(code)) {
      return Response.json(
        { error: 'Enter the 6-digit code we sent you.', code: 'INVALID_INPUT' },
        { status: 400 }
      );
    }

    // A ceiling on guesses that holds even when a script rotates its source address.
    const accountLimit = await throttle(base44, 'mobile-otp-verify', user.id, 15, 900);
    if (!accountLimit.allowed) {
      return Response.json(
        { error: 'Too many attempts. Please try again later.', code: 'TOO_MANY' },
        { status: 429 }
      );
    }

    const profiles = base44.asServiceRole.entities.StudentProfile;
    const counters = base44.asServiceRole.entities.MobileOtp;
    const page = await counters.filter(
      { account_id: user.id, mobile_key: mobile },
      { limit: 1, sort: '-created_date' }
    );
    const record = page.items[0];
    if (!record) return Response.json({ error: 'Request a new code.', code: 'NO_OTP' }, { status: 400 });

    if (isLocked(record)) {
      const retryAfterSeconds = secondsLeft(record.locked_until);
      return Response.json(
        {
          error: 'Too many wrong codes. Please try again later.',
          code: 'LOCKED',
          retryAfterSeconds,
          minutes: Math.ceil(retryAfterSeconds / 60),
        },
        { status: 429 }
      );
    }
    if (record.verified) return Response.json({ verified: true, alreadyVerified: true });
    if (isExpired(record)) {
      return Response.json({ error: 'That code has expired. Request a new one.', code: 'EXPIRED' }, { status: 400 });
    }

    if (!sameHash(record.otp_hash, await hashOtp(record.otp_salt, code))) {
      const attempts = (record.attempts || 0) + 1;
      const attemptsLeft = Math.max(0, OTP_MAX_ATTEMPTS - attempts);
      if (attemptsLeft === 0) {
        const lockedUntil = new Date(Date.now() + OTP_LOCK_SECONDS * 1000).toISOString();
        await counters.update(record.id, { attempts, locked_until: lockedUntil });
        return Response.json(
          {
            error: 'Too many wrong codes. Please try again later.',
            code: 'LOCKED',
            attemptsLeft: 0,
            minutes: Math.ceil(OTP_LOCK_SECONDS / 60),
          },
          { status: 429 }
        );
      }
      await counters.update(record.id, { attempts });
      return Response.json(
        { error: 'That code is not correct. Please try again.', code: 'INVALID', attemptsLeft },
        { status: 400 }
      );
    }

    // Correct code. It is spent now — a second use grants nothing new.
    const profilePage = await profiles.filter({ account_id: user.id }, { limit: 1 });
    const profile = profilePage.items[0];

    // Changing the number on an existing profile: the new number must still belong to one
    // account only, and that is re-checked on the server rather than trusted from the client.
    if (profile && profile.mobile_key !== mobile) {
      const conflict = await findConflicts(
        base44,
        { fullName: profile.full_name, email: profile.email, mobile },
        profile.id
      );
      if (conflict && conflict.field === 'mobile') {
        return Response.json(
          { error: 'This mobile number is already registered to another account.', code: 'MOBILE_TAKEN' },
          { status: 409 }
        );
      }
    }

    await counters.update(record.id, {
      verified: true,
      verified_at: new Date().toISOString(),
      attempts: 0,
    });

    if (profile) {
      await profiles.update(profile.id, {
        mobile,
        mobile_key: mobile,
        mobile_verified: true,
        mobile_verified_at: new Date().toISOString(),
      });
      return Response.json({ verified: true, mobileUpdated: profile.mobile_key !== mobile });
    }

    return Response.json({ verified: true, verifiedWindowMinutes: VERIFIED_WINDOW_MINUTES });
  } catch (error) {
    return serverError(error);
  }
}