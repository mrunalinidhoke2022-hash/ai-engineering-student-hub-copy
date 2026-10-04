import React from "react";
import { BadgeCheck, Clock } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// One line of the security summary: what it is, its masked value, and whether it is verified.
export default function SecurityStatusRow({ icon: Icon, label, value, verified, verifiedKey, pendingKey }) {
  const { t } = useLanguage();

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {value ? <p className="truncate font-mono text-xs text-muted-foreground">{value}</p> : null}
        </div>
      </div>

      {verified ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-success">
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {t(verifiedKey || "security.verified")}
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-warning">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {t(pendingKey || "security.notVerified")}
        </span>
      )}
    </div>
  );
}