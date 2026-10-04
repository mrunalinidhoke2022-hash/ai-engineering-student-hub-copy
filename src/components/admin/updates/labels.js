// Shared wording and tones for the Content Updates dashboard.

export const LIST_FIELDS = ["tags", "useful_for", "example_prompts", "related_tools"];

export const KINDS = ["", "new_tool", "tool_update", "price_change", "learning_resource", "hackathon", "announcement"];

export const PENDING_STATUSES = ["new", "updated", "needs_review"];

export const kindKey = (kind) => `adminUpdates.kind.${kind}`;

export const statusKey = (status) => `adminUpdates.status.${status}`;

export const statusTone = (status) =>
  ({
    published: "text-success bg-success/10 border-success/30",
    rejected: "text-destructive bg-destructive/10 border-destructive/30",
    verified: "text-primary bg-accent border-primary/30",
    needs_review: "text-warning bg-warning/10 border-warning/30",
  }[status] || "text-muted-foreground bg-secondary border-border");

export const riskTone = (risk) =>
  risk === "high" ? "text-warning bg-warning/10 border-warning/30" : "text-muted-foreground bg-secondary border-border";

// Dates are shown as "2 days ago" rather than a raw timestamp, so an admin can see staleness fast.
export const relativeLabel = (t, value) => {
  const stamp = new Date(value).getTime();
  if (!stamp) return t("adminUpdates.never");
  const minutes = Math.floor((Date.now() - stamp) / 60000);
  if (minutes < 2) return t("adminUpdates.justNow");
  if (minutes < 60) return minutes === 1 ? t("adminUpdates.minuteAgo") : t("adminUpdates.minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? t("adminUpdates.hourAgo") : t("adminUpdates.hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return days === 1 ? t("adminUpdates.dayAgo") : t("adminUpdates.daysAgo", { count: days });
};

export const shortDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};