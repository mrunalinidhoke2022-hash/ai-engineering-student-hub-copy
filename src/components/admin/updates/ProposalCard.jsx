import React from "react";
import { ExternalLink, Check, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { kindKey, riskTone, shortDate, statusKey, statusTone } from "./labels";

// One staged update. Everything an admin needs to decide is on the card: what it is, how risky it
// is, where it came from, and how confident the extraction was.
export default function ProposalCard({ proposal, onReview, onPublish, onReject, busy }) {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent text-primary">
              {t(kindKey(proposal.kind))}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${riskTone(proposal.risk)}`}>
              {t(`adminUpdates.risk.${proposal.risk}`)}
            </span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusTone(proposal.status)}`}>
              {t(statusKey(proposal.status))}
            </span>
          </div>
          <p className="font-heading font-bold text-sm mt-2 break-words">{proposal.title}</p>
          <p className="text-sm text-muted-foreground mt-1 break-words">{proposal.summary}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground mt-3">
        <span>{proposal.source_name}</span>
        <span>
          {t("adminUpdates.discovered")} {shortDate(proposal.discovered_at)}
        </span>
        <span>
          {t("adminUpdates.confidence")} {Math.round((proposal.confidence || 0) * 100)}%
        </span>
        {proposal.source_url ? (
          <a
            href={proposal.source_url}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 font-semibold text-primary"
          >
            {t("adminUpdates.source")} <ExternalLink className="w-3 h-3" />
          </a>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <Button size="sm" variant="outline" className="gap-1.5 min-h-[40px]" onClick={() => onReview(proposal)}>
          <Eye className="w-3.5 h-3.5" /> {t("adminUpdates.review")}
        </Button>
        <Button size="sm" className="gap-1.5 min-h-[40px]" onClick={() => onPublish(proposal)} disabled={busy}>
          <Check className="w-3.5 h-3.5" /> {t("adminUpdates.approve")}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5 min-h-[40px]" onClick={() => onReject(proposal)} disabled={busy}>
          <X className="w-3.5 h-3.5" /> {t("adminUpdates.reject")}
        </Button>
      </div>
    </div>
  );
}