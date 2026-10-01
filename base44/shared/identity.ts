// Shared identity rules: normalization, uniqueness checks and User ID generation.
// Used by checkIdentity, completeRegistration, updateProfile and loginWithIdentifier.

export const normalizeName = (value) => (value || "").trim().replace(/\s+/g, " ");

export const nameKey = (value) => normalizeName(value).toLowerCase();

export const normalizeEmail = (value) => (value || "").trim().toLowerCase();

// +91 98765 43210, 91-9876543210, 09876543210 and 9876543210 all map to 9876543210.
export const normalizeMobile = (value) => {
  const digits = (value || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
};

export const buildUserId = (value) =>
  normalizeName(value)
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const findOne = async (base44, query) => {
  const page = await base44.asServiceRole.entities.StudentProfile.filter(query, { limit: 1 });
  return page.items[0] || null;
};

// Returns the first identity that is already registered, or null when all are free.
export const findConflicts = async (base44, values, ignoreId) => {
  const candidates = [
    {
      field: "full_name",
      key: nameKey(values.fullName),
      query: { name_key: nameKey(values.fullName) },
      message: "This name is already registered. Please use your registered account or contact the administrator.",
    },
    {
      field: "email",
      key: normalizeEmail(values.email),
      query: { email_key: normalizeEmail(values.email) },
      message: "This email address is already registered.",
    },
    {
      field: "mobile",
      key: normalizeMobile(values.mobile),
      query: { mobile_key: normalizeMobile(values.mobile) },
      message: "This mobile number is already registered.",
    },
  ];

  for (const candidate of candidates) {
    if (!candidate.key) continue;
    const record = await findOne(base44, candidate.query);
    if (record && record.id !== ignoreId) {
      return { field: candidate.field, message: candidate.message, record };
    }
  }
  return null;
};

// SANCHITA-BHASKAR-CHIMTE-001, incrementing only if that exact User ID is taken.
export const nextUserId = async (base44, fullName) => {
  const base = buildUserId(fullName) || "STUDENT";
  for (let suffix = 1; suffix < 200; suffix += 1) {
    const candidate = `${base}-${String(suffix).padStart(3, "0")}`;
    const taken = await findOne(base44, { user_id: candidate });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now()}`;
};

// Two requests arriving at the same moment both pass the pre-check. Both re-check
// after insert and the same deterministic rule decides the survivor, so exactly one
// profile is kept.
export const rollBackIfLost = async (base44, values, profile) => {
  const conflict = await findConflicts(base44, values, profile.id);
  if (!conflict) return null;
  const mine = `${profile.created_date}|${profile.id}`;
  const theirs = `${conflict.record.created_date}|${conflict.record.id}`;
  if (mine < theirs) return null;
  await base44.asServiceRole.entities.StudentProfile.delete(profile.id);
  return conflict;
};