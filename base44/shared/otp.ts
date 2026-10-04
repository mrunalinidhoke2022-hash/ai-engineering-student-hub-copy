// One-time codes for mobile verification.
//
// The code never leaves the server: only a salted SHA-256 hash is stored, the plain code goes
// to the student's own phone through the SMS gateway, and no response, log line or query result
// ever carries it. The salt is random per code, so a stored hash is useless on its own.

export const OTP_DIGITS = 6;
export const OTP_TTL_SECONDS = 300;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LOCK_SECONDS = 900;

const toHex = (buffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const randomHex = (bytes) => {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return toHex(buffer);
};

const sha256 = async (value) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return toHex(digest);
};

// A fresh code plus the per-record salt that makes the stored hash useless on its own.
export const createOtp = async () => {
  const buffer = new Uint32Array(1);
  crypto.getRandomValues(buffer);
  const code = String(buffer[0] % 10 ** OTP_DIGITS).padStart(OTP_DIGITS, '0');
  const salt = randomHex(16);
  return { salt, hash: await sha256(`${salt}:${code}`), code };
};

export const hashOtp = (salt, code) => sha256(`${salt}:${code}`);

// Constant-time comparison: returning on the first mismatched character lets the response time
// narrow down the code, one digit at a time.
export const sameHash = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return difference === 0;
};

export const isExpired = (record) =>
  !record?.expires_at || new Date(record.expires_at).getTime() < Date.now();

export const isLocked = (record) =>
  Boolean(record?.locked_until) && new Date(record.locked_until).getTime() > Date.now();

export const secondsLeft = (until) => Math.max(1, Math.ceil((new Date(until).getTime() - Date.now()) / 1000));