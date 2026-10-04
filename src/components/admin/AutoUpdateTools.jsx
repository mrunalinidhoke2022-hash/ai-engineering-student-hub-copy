import React, { useState } from "react";
import { RefreshCw, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { describeError } from "@/lib/authErrors";

// Admin shortcut on the dashboard: runs the content sync now. Discoveries are staged for review —
// nothing is published from here, which is why the button now points at the review queue.
export default function AutoUpdateTools({ onDone }) {
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const check = async () => {
    setChecking(true);
    try {
      const { data } = await base44.functions.invoke("syncAITools", {});
      if (data?.error) {
        toast({ description: t("adminUpdates.syncFailedToast"), variant: "destructive" });
        return;
      }
      toast({ description: data?.summary || t("adminUpdates.syncDone") });
      onDone?.();
    } catch (err) {
      toast({ description: describeError(t, err, "errors.generic"), variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mt-8 flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <p className="font-heading font-bold text-sm">{t("adminUpdates.card.title")}</p>
        <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">{t("adminUpdates.card.desc")}</p>
        <Link
          to="/admin/content-updates"
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-2"
        >
          {t("adminUpdates.card.open")} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <Button size="sm" variant="outline" className="gap-1.5 shrink-0 min-h-[40px]" onClick={check} disabled={checking}>
        <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
        {checking ? t("adminUpdates.refreshing") : t("adminUpdates.refresh")}
      </Button>
    </div>
  );
}