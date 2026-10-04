// Honest wording for verification dates.
//
// Nothing is described as current unless the system actually verified it: an entry with no
// verification date says so, and a date older than six weeks is shown as a month rather than as a
// day count that would imply freshness.

export const daysSince = (value) => {
  const stamp = new Date(value).getTime();
  if (!stamp) return null;
  return Math.floor((Date.now() - stamp) / 86400000);
};

export const monthYear = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

export const verifiedLabel = (t, value) => {
  const days = daysSince(value);
  if (days === null) return t("updates.notVerified");
  if (days <= 0) return t("updates.verifiedToday");
  if (days === 1) return t("updates.verifiedOne");
  if (days < 45) return t("updates.verifiedDays", { count: days });
  return t("updates.verifiedOn", { date: monthYear(value) });
};

export const pricingLabel = (t, value) => {
  const label = monthYear(value);
  return label ? t("updates.pricingVerified", { date: label }) : "";
};