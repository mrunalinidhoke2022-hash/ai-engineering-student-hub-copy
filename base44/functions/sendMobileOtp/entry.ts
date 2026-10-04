import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { normalizeMobile } from '../../shared/identity.ts';
import { throttle, clientIp } from '../../shared/throttle.ts';
import { serverError } from '../../shared/http.ts';
import { createOtp, OTP_TTL_SECONDS } from '../../shared/otp.ts';

// Sends a one-time code to the signed-in student's own mobile number.
//
// The code is bound to the caller's account, so one student can never verify — or lock out —
// another. Delivery needs an SMS gateway: until SMS_PROVIDER_URL and SMS_API_KEY are set this
// answers that delivery is not configured, instead of inventing a code nobody can receive.
// The code itself is never returned, never logged, and never stored in plain text.

const SMS_TIMEOUT_MS = 8000;

const smsConfig = () => {
  try {
    const url = secrets.get('SMS_PROVIDER_URL');
    const apiKey = secrets.get('SMS_API_KEY');
    if (url && apiKey) return { url, apiKey };
  } catch {
    // Secrets not set yet: reported as "not configured", never as a crash.
  }
  return null;
};

const deliver = async (mobile, message, config) => {
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify({ to: `+91${mobile}`, message, sender: 'DEVLAUNCH' }),
      signal: AbortSignal.timeout(SMS_TIMEOUT_MS),
    });
    return response.ok;
  } catch (error) {
    // The gateway's own fault only; the message body (and so the code) is never logged.
    console.error('[mobile-otp] delivery failed:', error?.message || String(error));
    return false;
  }
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Sign in required.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const mobile = normalizeMobile(body.mobile);
    if (mobile.length !== 10) {
      return Response.json(
        { error: 'A valid 10-digit mobile number is required.', code: 'INVALID_MOBILE' },
        { status: 400 }
      );
    }

    const config = smsConfig();
    if (!config) {
      // Nothing is generated and nothing is stored: a code that could never arrive would only
      // leave a student waiting for a message that does not exist.
      return Response.json({ delivery: 'not_configured', code: 'SMS_NOT_CONFIGURED' });
    }

    const ipLimit = await throttle(base44, 'mobile-otp-ip', clientIp(req), 30, 3600);
    if (!ipLimit.allowed) {
      return Response.json(
        { error: 'Too many code requests. Please try again later.', code: 'TOO_MANY' },
        { status: 429 }
      );
    }

    // Resend cooldown first, then the hourly ceilings per account and per number.
    const cooldown = await throttle(base44, 'mobile-otp-cooldown', user.id, 1, 60);
    if (!cooldown.allowed) {
      return Response.json(
        {
          error: 'Please wait a moment before requesting another code.',
          code: 'COOLDOWN',
          retryAfterSeconds: cooldown.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const accountLimit = await throttle(base44, 'mobile-otp-account', user.id, 5, 3600);
    const numberLimit = await throttle(base44, 'mobile-otp-number', mobile, 5, 3600);
    if (!accountLimit.allowed || !numberLimit.allowed) {
      return Response.json(
        { error: 'Too many codes requested. Please try again later.', code: 'TOO_MANY' },
        { status: 429 }
      );
    }

    const counters = base44.asServiceRole.entities.MobileOtp;
    const page = await counters.filter(
      { account_id: user.id, mobile_key: mobile },
      { limit: 1, sort: '-created_date' }
    );
    const record = page.items[0];
    if (record?.verified) return Response.json({ delivery: 'already_verified', verified: true });

    const otp = await createOtp();
    const text = `${otp.code} is your DevLaunch verification code. It expires in 5 minutes. Never share it with anyone.`;

    const sent = await deliver(mobile, text, config);
    if (!sent) {
      return Response.json(
        { error: 'We could not send the code right now. Please try again.', code: 'SEND_FAILED' },
        { status: 502 }
      );
    }

    // Only the hash is stored, and only after the message actually went out. Replacing the
    // previous row also clears any earlier attempt count or lock, so a fresh code always
    // arrives with a full set of tries.
    if (record) await counters.delete(record.id);
    await counters.create({
      account_id: user.id,
      mobile_key: mobile,
      otp_salt: otp.salt,
      otp_hash: otp.hash,
      expires_at: new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString(),
      attempts: 0,
      verified: false,
    });

    return Response.json({ delivery: 'sent', expiresInSeconds: OTP_TTL_SECONDS });
  } catch (error) {
    return serverError(error);
  }
}