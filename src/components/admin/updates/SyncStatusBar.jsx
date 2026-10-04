import React from "react";
import { RefreshCw, RotateCcw, AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { relativeLabel } from "./labels";

// The state of the sync at a glance: when it last succeeded, when it will look again, what went
// wrong, and the two buttons an admin needs when something needs attention.
export default function SyncStatusBar({ settings, sources, onSync, busy }) {
  const { t } = useLanguage();
  const failed = sources.filter((source) => source.last_status === "error");
  const off = settings?.enabled === false;

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t("adminUpdates.lastSync")}</p>
            <p className="text-sm font-semibold">{relativeLabel(t, settings?.last_success_at)}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <CalendarClock className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t("adminUpdates.nextSync")}</p>
            <p className="text-sm font-semibold">
              {off ? t("adminUpdates.off") : settings?.next_run_at ? relativeLabel(t, settings.next_run_at) : t("adminUpdates.never")}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${failed.length ? "text-warning" : "text-muted-foreground"}`} />
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{t("adminUpdates.syncFailed")}</p>
            <p className="text-sm font-semibold truncate">
              {failed.length ? `${failed.length} — ${settings?.last_error || ""}`.trim() : t("adminUpdates.noErrors")}
            </p>
          </div>
        </div>
      </div>

      {settings?.last_run_summary ? (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">{settings.last_run_summary}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 mt-3">
        <Button size="sm" className="gap-1.5" onClick={() => onSync(false)} disabled={busy}>
          <RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} />
          {busy ? t("adminUpdates.refreshing") : t("adminUpdates.refresh")}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onSync(true)} disabled={busy || !failed.length}>
          <RotateCcw className="w-4 h-4" /> {t("adminUpdates.retryFailed")}
        </Button>
      </div>
    </div>
  );
}