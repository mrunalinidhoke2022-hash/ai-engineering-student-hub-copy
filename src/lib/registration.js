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