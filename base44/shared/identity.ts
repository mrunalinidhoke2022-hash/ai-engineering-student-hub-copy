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

// Name-only conflict check, for the anonymous pre-check (checkIdentity).
//
// Comparing the email or the mobile number there turned the endpoint into an account
// enumeration oracle: a stranger could send a throwaway name and number plus a candidate
// address and read that address's registration status straight off the yes/no answer — and
// with rotating connections, harvest the app's student list without ever signing in.
// The name is the one value a caller supplies as their own identity, so answering for it
// reveals nothing they did not already hold. Email and mobile duplicates are still refused —
// with the exact field named — by completeRegistration and updateProfile, which only ever run
// for a signed-in caller.
export const findNameConflict = async (base44, fullName) => {
  const key = nameKey(fullName);
  if (!key) return null;
  return findOne(base44, { name_key: key });
};

// A chosen User ID. Stored in the same uppercase, hyphen-separated form the generated ones use,
// so 'sanchita chimate' and 'SANCHITA-CHIMATE' are one and the same name and cannot both exist.
export const normalizeUsername = (value) => buildUserId(value);

export const validateUsername = (value) => {
  const key = normalizeUsername(value);
  return /^[A-Z0-9][A-Z0-9-]{2,39}$/.test(key);
};

// The username someone typed may already belong to another profile.
export const findUsernameConflict = async (base44, username, ignoreId) => {
  const key = normalizeUsername(username);
  if (!key) return null;
  const record = await findOne(base44, { user_id: key });
  return record && record.id !== ignoreId ? record : null;
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