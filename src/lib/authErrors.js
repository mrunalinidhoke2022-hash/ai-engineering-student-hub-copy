// Turns whatever went wrong into a sentence the reader can understand in their own language.
//
// The backend answers with a stable `code` (and, for the platform's own auth calls, only a
// message), so the pages never show a server string or a raw error: they show a translation.

const CODE_KEYS = {
  NAME_TAKEN: "errors.nameTaken",
  EMAIL_TAKEN: "errors.emailTaken",
  MOBILE_TAKEN: "errors.mobileTaken",
  USERNAME_TAKEN: "errors.usernameTaken",
  INVALID_USERNAME: "register.account.errUsername",
  INVALID_MOBILE: "register.contact.errMobile",
  INVALID_INPUT: "errors.generic",
  TOO_MANY: "errors.tooManyAttempts",
  COOLDOWN: "otp.cooldown",
  LOCKED: "otp.locked",
  EXPIRED: "otp.expired",
  NO_OTP: "otp.expired",
  INVALID: "otp.invalid",
};

const MESSAGE_KEYS = [
  [/too many/i, "errors.tooManyAttempts"],
  [/expired/i, "otp.expired"],
  [/already (exists|registered)|user already exists|email.*in use/i, "errors.emailTaken"],
  [/not verified|verify your email/i, "errors.unverified"],
  [/otp|verification code/i, "otp.invalid"],
  [/invalid|incorrect|wrong|failed|credential/i, "errors.invalidCredentials"],
];

export const errorPayload = (error) =>
  error?.response?.data ?? error?.data ?? (typeof error === "object" ? error : {}) ?? {};

// Translation key for a failure, or null when nothing matches.
export const errorKey = (error) => {
  const payload = errorPayload(error);
  if (payload?.code && CODE_KEYS[payload.code]) return CODE_KEYS[payload.code];

  const message = String(payload?.error || payload?.message || error?.message || "");
  const match = MESSAGE_KEYS.find(([pattern]) => pattern.test(message));
  return match ? match[1] : null;
};

// `t` is the translate function; fallbackKey covers anything unrecognised.
export const describeError = (t, error, fallbackKey = "errors.generic") => {
  const key = errorKey(error);
  return t(key || fallbackKey);
};