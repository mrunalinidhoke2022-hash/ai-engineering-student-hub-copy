import React from "react";
import { CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { verifiedLabel, pricingLabel, daysSince } from "@/lib/verified";

// Tells the reader when this entry was last checked against a source, and says so plainly when it
// has never been checked. The pricing line only appears when pricing itself was verified.
export default function ToolVerificationNote({ tool }) {
  const { t } = useLanguage();
  const days = daysSince(tool.last_verified);
  const fresh = days !== null && days < 45;

  return (
    <div
      className={`rounded-lg border p-3.5 text-xs ${
        fresh ? "border-border bg-secondary/60 text-muted-foreground" : "border-warning/40 bg-warning/10 text-foreground"
      }`}
    >
      <div className="flex items-start gap-2">
        {fresh ? (
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-success" />
        ) : (
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
        )}
        <div className="min-w-0 space-y-1">
          <p className="font-semibold">{verifiedLabel(t, tool.last_verified)}</p>
          {tool.pricing_verified ? <p>{pricingLabel(t, tool.pricing_verified)}</p> : null}
          {tool.source_url ? (
            <a
              href={tool.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 font-semibold text-primary"
            >
              {t("updates.viewSource")} <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}