export const normalizeMobile = (value) => {
  const digits = (value || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
};

export const isValidMobile = (value) => /^[6-9]\d{9}$/.test(normalizeMobile(value));

export const formatMobile = (value) => {
  const digits = normalizeMobile(value);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : value || "";
};

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export const validatePhoto = (file) => {
  if (!file) return "";
  if (!ALLOWED_TYPES.includes(file.type)) return "Profile photo must be a JPG, JPEG, PNG or WEBP image.";
  if (file.size > MAX_BYTES) return "Profile photo must be smaller than 5 MB.";
  return "";
};

// Kept in step with the server's identity rules so the preview of a User ID matches the one
// that gets stored. Spaces become hyphens; anything else is dropped.
export const buildUserId = (value) =>
  (value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase()
    .replace(/[^A-Z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "-");

export const isValidUsername = (value) => /^[A-Z0-9][A-Z0-9-]{2,39}$/.test(buildUserId(value));

export const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((value || "").trim());

export const PASSWORD_RULES = [
  { key: "pw.rule.length", test: (value) => value.length >= 8 },
  { key: "pw.rule.upper", test: (value) => /[A-Z]/.test(value) },
  { key: "pw.rule.lower", test: (value) => /[a-z]/.test(value) },
  { key: "pw.rule.number", test: (value) => /\d/.test(value) },
  { key: "pw.rule.special", test: (value) => /[^A-Za-z0-9]/.test(value) },
];

export const passwordIssues = (value) =>
  PASSWORD_RULES.filter((rule) => !rule.test(value || "")).map((rule) => rule.key);

export const passwordMeetsRules = (value) => passwordIssues(value).length === 0;

// A rough gauge for the student, not a security decision — the server is free to hold a
// stricter line later, and the rules above are what actually gate the form.
export const passwordStrength = (value) => {
  if (!value) return { level: 0, key: "" };
  let score = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  if (value.length >= 12) score += 1;
  if (/^(.)\1+$/.test(value) || /^(123|abc|qwerty|password)/i.test(value)) score -= 2;
  if (score <= 2) return { level: 1, key: "pw.strength.weak" };
  if (score === 3) return { level: 2, key: "pw.strength.medium" };
  if (score === 4) return { level: 3, key: "pw.strength.strong" };
  return { level: 4, key: "pw.strength.veryStrong" };
};