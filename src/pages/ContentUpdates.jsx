import React, { useCallback, useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { describeError } from "@/lib/authErrors";
import SyncStatusBar from "@/components/admin/updates/SyncStatusBar";
import ReviewQueue from "@/components/admin/updates/ReviewQueue";
import IssueQueue from "@/components/admin/updates/IssueQueue";
import UpdateHistoryList from "@/components/admin/updates/UpdateHistoryList";
import SourceManager from "@/components/admin/updates/SourceManager";
import UpdateSettingsPanel from "@/components/admin/updates/UpdateSettingsPanel";

const TABS = ["review", "issues", "history", "sources", "settings"];

// Admin → Content Updates. Nothing reaches students from here without a decision being made on this
// page: the pipeline only stages proposals, and this is where they are edited, approved or rejected.
export default function ContentUpdates() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [settings, setSettings] = useState(null);
  const [sources, setSources] = useState([]);
  const [counts, setCounts] = useState({});
  const [tab, setTab] = useState("review");
  const [busy, setBusy] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    if (user?.role !== "admin") return;
    const [settingsPage, sourcePage, pending, published, rejected, issues] = await Promise.all([
      base44.entities.AutoUpdateSetting.filter({ label: "default" }, { limit: 1 }),
      base44.entities.ContentSource.list({ sort: "name", limit: 60 }),
      base44.entities.ContentUpdate.count({ status: { $in: ["new", "updated", "needs_review"] } }),
      base44.entities.ContentUpdate.count({ status: "published" }),
      base44.entities.ContentUpdate.count({ status: "rejected" }),
      base44.entities.ContentIssue.count({ status: "new" }),
    ]);
    setSettings(settingsPage.items[0] || null);
    setSources(sourcePage.items);
    setCounts({ pending, published, rejected, issues });
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  if (user?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-10 h-10 text-destructive mx-auto mb-3" />
        <h1 className="font-heading font-bold text-xl">{t("adminUpdates.adminsOnly")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("adminUpdates.adminsOnlyDesc")}</p>
      </div>
    );
  }

  const sync = async (onlyFailed) => {
    setBusy(true);
    try {
      const { data } = await base44.functions.invoke("syncAITools", onlyFailed ? { only_failed: true } : {});
      if (data?.error) {
        toast({ description: t("adminUpdates.syncFailedToast"), variant: "destructive" });
        return;
      }
      toast({ description: data?.summary || t("adminUpdates.syncDone") });
      await load();
      setReloadKey((value) => value + 1);
    } catch (err) {
      toast({ description: describeError(t, err, "errors.generic"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const countFor = (key) =>
    ({ review: counts.pending, issues: counts.issues, history: (counts.published || 0) + (counts.rejected || 0) }[key] ?? null);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-heading font-extrabold text-3xl">{t("adminUpdates.title")}</h1>
      <p className="text-muted-foreground mt-1">{t("adminUpdates.subtitle")}</p>

      <div className="mt-6">
        <SyncStatusBar settings={settings} sources={sources} onSync={sync} busy={busy} />
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto scroll-touch pb-1">
        {TABS.map((option) => {
          const count = countFor(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => setTab(option)}
              className={`shrink-0 min-h-[40px] text-sm font-semibold px-3.5 rounded-full border transition-colors ${
                tab === option ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t(`adminUpdates.tab.${option}`)}
              {count ? <span className="ml-1.5 text-xs">({count})</span> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-5">
        {tab === "review" ? <ReviewQueue reloadKey={reloadKey} onChanged={load} /> : null}
        {tab === "issues" ? <IssueQueue /> : null}
        {tab === "history" ? <UpdateHistoryList /> : null}
        {tab === "sources" ? <SourceManager sources={sources} onChanged={load} /> : null}
        {tab === "settings" ? <UpdateSettingsPanel settings={settings} onSaved={load} /> : null}
      </div>
    </div>
  );
}