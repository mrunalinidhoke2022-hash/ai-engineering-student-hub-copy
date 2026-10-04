import React, { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { describeError } from "@/lib/authErrors";
import { LIST_FIELDS, kindKey, riskTone } from "./labels";

const parse = (value) => {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
};

const TEXTAREA_FIELDS = ["description", "what_is", "why_use", "what_can_you_do", "how_to_start", "tutorial", "common_mistakes", "practice_challenge", "advanced_features", "change_note"];

// Reviewing one proposal: what the record says today, what is proposed, editable before it goes
// live. Saving here changes nothing on the site — only publishing does.
export default function ProposalReviewDialog({ proposal, open, onOpenChange, onChanged }) {
  const [fields, setFields] = useState({});
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (!open || !proposal) return;
    setFields(parse(proposal.proposed));
    setNote(proposal.review_note || "");
    setError("");
  }, [open, proposal]);

  if (!proposal) return null;

  const previous = parse(proposal.previous_value);
  const unmatched =
    (proposal.kind === "tool_update" || proposal.kind === "price_change") && !proposal.target_id;

  const act = async (action) => {
    setBusy(action);
    setError("");
    try {
      const payload = { id: proposal.id, action, note };
      if (action !== "reject" && action !== "reopen") payload.fields = fields;
      const { data } = await base44.functions.invoke("reviewContentUpdate", payload);
      if (data?.error) {
        setError(data.code === "PUBLISH_FAILED" ? t("adminUpdates.publishFailed") : t("errors.generic"));
        return;
      }
      const messages = {
        save: "adminUpdates.saved",
        verify: "adminUpdates.verified",
        publish: "adminUpdates.published",
        reject: "adminUpdates.rejected",
      };
      toast({ description: t(messages[action]) });
      onChanged?.();
      if (action !== "save") onOpenChange(false);
    } catch (err) {
      setError(describeError(t, err, "errors.generic"));
    } finally {
      setBusy("");
    }
  };

  const fieldNames = Object.keys(fields);

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-h-[88vh] overflow-y-auto scroll-touch">
        <DialogHeader>
          <DialogTitle>{t("adminUpdates.reviewTitle")}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-accent text-primary">
            {t(kindKey(proposal.kind))}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${riskTone(proposal.risk)}`}>
            {t(`adminUpdates.risk.${proposal.risk}`)}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t("adminUpdates.confidence")} {Math.round((proposal.confidence || 0) * 100)}%
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-semibold break-words">{proposal.title}</p>
          <p className="text-sm text-muted-foreground break-words">{proposal.summary}</p>
          {proposal.change_note ? <p className="text-xs text-muted-foreground">{proposal.change_note}</p> : null}
          {proposal.pricing_note ? (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">{t("adminUpdates.pricingNote")}: </span>
              {proposal.pricing_note}
            </p>
          ) : null}
          {proposal.source_url ? (
            <a
              href={proposal.source_url}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              {proposal.source_name} <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
        </div>

        {unmatched ? (
          <p className="text-xs font-medium text-warning bg-warning/10 rounded-md px-3 py-2">{t("adminUpdates.noMatch")}</p>
        ) : null}

        {fieldNames.length ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("adminUpdates.proposed")}</p>
            {fieldNames.map((field) => (
              <div key={field}>
                <Label htmlFor={`field-${field}`}>{field.replace(/_/g, " ")}</Label>
                {previous[field] ? (
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-through break-words">{previous[field]}</p>
                ) : null}
                {TEXTAREA_FIELDS.includes(field) ? (
                  <Textarea
                    id={`field-${field}`}
                    value={fields[field]}
                    onChange={(e) => setFields({ ...fields, [field]: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <Input
                    id={`field-${field}`}
                    value={Array.isArray(fields[field]) ? fields[field].join(", ") : fields[field]}
                    onChange={(e) =>
                      setFields({
                        ...fields,
                        [field]: LIST_FIELDS.includes(field)
                          ? e.target.value.split(",").map((part) => part.trim()).filter(Boolean)
                          : e.target.value,
                      })
                    }
                    className="mt-1"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("adminUpdates.noChanges")}</p>
        )}

        <div>
          <Label htmlFor="review-note">{t("adminUpdates.reviewNote")}</Label>
          <Textarea id="review-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} className="mt-1" />
        </div>

        {error ? <p className="text-xs font-medium text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => act("save")} disabled={!!busy}>
            {busy === "save" ? t("common.saving") : t("adminUpdates.save")}
          </Button>
          <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => act("reject")} disabled={!!busy}>
            {t("adminUpdates.reject")}
          </Button>
          <Button className="flex-1 min-h-[44px]" onClick={() => act("publish")} disabled={!!busy}>
            {t("adminUpdates.approve")}
          </Button>
        </div>
        <button
          type="button"
          onClick={() => act("verify")}
          disabled={!!busy}
          className="text-xs font-semibold text-muted-foreground underline self-center"
        >
          {t("adminUpdates.verify")}
        </button>
      </DialogContent>
    </Dialog>
  );
}