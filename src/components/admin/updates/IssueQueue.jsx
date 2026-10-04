import React, { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import EmptyState from "@/components/common/EmptyState";
import { shortDate, statusTone } from "./labels";

const STATUSES = ["", "new", "in_progress", "resolved", "rejected"];

// Student reports about wrong or out-of-date information. This is the admin review system those
// reports land in: nothing here changes a tool — the admin fixes it on the tool itself.
export default function IssueQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const load = useCallback(() => {
    setLoading(true);
    const query = status ? { status } : {};
    return base44.entities.ContentIssue.filter(query, { sort: "-created_date", limit: 30 })
      .then((page) => setItems(page.items))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  const setIssueStatus = async (issue, next) => {
    setBusy(issue.id);
    try {
      const patch = { status: next };
      if (next === "resolved") patch.resolved_at = new Date().toISOString();
      await base44.entities.ContentIssue.update(issue.id, patch);
      toast({ description: t(`adminUpdates.issue.${next}`) });
      await load();
    } catch {
      toast({ description: t("errors.generic"), variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto scroll-touch pb-1">
        {STATUSES.map((option) => (
          <button
            key={option || "all"}
            type="button"
            onClick={() => setStatus(option)}
            className={`shrink-0 min-h-[36px] text-xs font-semibold px-3 rounded-full border transition-colors ${
              status === option ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-secondary"
            }`}
          >
            {option ? t(`adminUpdates.issueStatus.${option}`) : t("adminUpdates.allKinds")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : items.length === 0 ? (
        <EmptyState title={t("adminUpdates.emptyIssues")} description={t("adminUpdates.emptyIssuesDesc")} />
      ) : (
        <div className="space-y-3">
          {items.map((issue) => (
            <div key={issue.id} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-heading font-bold text-sm break-words">{issue.tool_name}</p>
                  <p className="text-xs font-semibold text-primary mt-0.5">{t(`updates.type.${issue.issue_type}`)}</p>
                  {issue.message ? <p className="text-sm text-muted-foreground mt-1 break-words">{issue.message}</p> : null}
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusTone(issue.status)}`}>
                  {t(`adminUpdates.issueStatus.${issue.status}`)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {t("adminUpdates.issue.by")} {issue.reporter_name || t("adminUpdates.issue.unknown")} · {shortDate(issue.created_date)}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {issue.status !== "in_progress" ? (
                  <button
                    type="button"
                    onClick={() => setIssueStatus(issue, "in_progress")}
                    disabled={busy === issue.id}
                    className="min-h-[40px] text-xs font-semibold px-3 rounded-md border border-border hover:bg-secondary"
                  >
                    {t("adminUpdates.issue.inProgress")}
                  </button>
                ) : null}
                {issue.status !== "resolved" ? (
                  <button
                    type="button"
                    onClick={() => setIssueStatus(issue, "resolved")}
                    disabled={busy === issue.id}
                    className="min-h-[40px] text-xs font-semibold px-3 rounded-md border border-success/40 text-success hover:bg-success/10"
                  >
                    {t("adminUpdates.issue.resolved")}
                  </button>
                ) : null}
                {issue.status !== "rejected" ? (
                  <button
                    type="button"
                    onClick={() => setIssueStatus(issue, "rejected")}
                    disabled={busy === issue.id}
                    className="min-h-[40px] text-xs font-semibold px-3 rounded-md border border-border text-muted-foreground hover:bg-secondary"
                  >
                    {t("adminUpdates.issue.rejected")}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}