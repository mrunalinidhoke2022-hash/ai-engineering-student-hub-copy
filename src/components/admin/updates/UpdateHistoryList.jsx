import React, { useCallback, useEffect, useState } from "react";
import { RotateCcw, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import EmptyState from "@/components/common/EmptyState";
import { kindKey, shortDate, statusKey, statusTone } from "./labels";

// The audit log: everything that was published or rejected, who decided it, and when — including
// the trail of actions recorded on each item.
export default function UpdateHistoryList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const load = useCallback(() => {
    setLoading(true);
    return base44.entities.ContentUpdate.filter(
      { status: { $in: ["published", "rejected"] } },
      { sort: "-updated_date", limit: 30 }
    )
      .then((page) => setItems(page.items))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const reopen = async (item) => {
    setBusy(item.id);
    try {
      const { data } = await base44.functions.invoke("reviewContentUpdate", { id: item.id, action: "reopen" });
      if (data?.error) {
        toast({ description: t("errors.generic"), variant: "destructive" });
        return;
      }
      await load();
    } finally {
      setBusy("");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  if (!items.length) return <EmptyState title={t("adminUpdates.emptyHistory")} description={t("adminUpdates.emptyHistoryDesc")} />;

  return (
    <div className="bg-card border border-border rounded-lg divide-y divide-border overflow-hidden">
      {items.map((item) => (
        <div key={item.id} className="p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-semibold break-words">{item.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {t(kindKey(item.kind))} ·{" "}
                {item.status === "published"
                  ? `${t("adminUpdates.published")} ${shortDate(item.published_at || item.updated_date)}`
                  : `${t("adminUpdates.rejected")} ${shortDate(item.reviewed_at || item.updated_date)}`}
                {item.reviewed_by ? ` · ${item.reviewed_by}` : ""}
              </p>
              {item.review_note ? (
                <p className="text-xs text-muted-foreground mt-1 break-words">
                  <span className="font-semibold">{t("adminUpdates.reviewNote")}: </span>
                  {item.review_note}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusTone(item.status)}`}>
                {t(statusKey(item.status))}
              </span>
              {item.source_url ? (
                <a href={item.source_url} target="_blank" rel="noreferrer noopener" className="text-primary">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}
            </div>
          </div>

          {item.events?.length ? (
            <ul className="mt-2 space-y-0.5">
              {item.events.slice(-3).map((event, index) => (
                <li key={index} className="text-[11px] text-muted-foreground">
                  {shortDate(event.at)} · {event.action}
                  {event.by ? ` · ${event.by}` : ""}
                  {event.note ? ` · ${event.note}` : ""}
                </li>
              ))}
            </ul>
          ) : null}

          {item.status === "rejected" ? (
            <button
              type="button"
              onClick={() => reopen(item)}
              disabled={busy === item.id}
              className="mt-3 min-h-[40px] inline-flex items-center gap-1.5 text-xs font-semibold px-3 rounded-md border border-border hover:bg-secondary"
            >
              <RotateCcw className="w-3.5 h-3.5" /> {t("adminUpdates.reopen")}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}