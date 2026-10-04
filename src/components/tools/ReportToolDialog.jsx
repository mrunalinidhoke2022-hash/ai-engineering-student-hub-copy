import React, { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { describeError } from "@/lib/authErrors";

const TYPES = ["broken_link", "incorrect_pricing", "incorrect_description", "tool_unavailable", "incorrect_information"];

// One-click way for a student to flag an entry that looks wrong. The report lands in the admin
// review queue as a ContentIssue — it is never applied to the tool automatically.
export default function ReportToolDialog({ tool }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const { t } = useLanguage();

  const submit = async () => {
    if (!type) {
      setError(t("updates.reportSelectType"));
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await base44.functions.invoke("reportContentIssue", {
        tool_id: tool.id,
        issue_type: type,
        message,
      });
      if (data?.error) {
        setError(t("updates.reportFailed"));
        return;
      }
      setOpen(false);
      setType("");
      setMessage("");
      toast({ description: t("updates.reportSent") });
    } catch (err) {
      setError(describeError(t, err, "updates.reportFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="outline" className="gap-1.5" onClick={() => setOpen(true)}>
        <Flag className="w-3.5 h-3.5" /> {t("updates.report")}
      </Button>

      <Dialog open={open} onOpenChange={(next) => !busy && setOpen(next)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto scroll-touch">
          <DialogHeader>
            <DialogTitle>{t("updates.reportTitle")}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">{t("updates.reportDesc")}</p>

          <div className="mt-2">
            <Label>{t("updates.reportType")}</Label>
            <div className="mt-2 space-y-2">
              {TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={`w-full min-h-[44px] text-left text-sm px-3 py-2.5 rounded-lg border transition-colors ${
                    type === option ? "border-primary bg-accent text-primary font-semibold" : "border-border hover:bg-secondary"
                  }`}
                >
                  {t(`updates.type.${option}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <Label htmlFor="report-details">{t("updates.reportDetails")}</Label>
            <Textarea
              id="report-details"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("updates.reportPlaceholder")}
              maxLength={500}
              className="mt-1"
            />
          </div>

          {error ? (
            <p className="text-xs font-medium text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>
          ) : null}

          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button className="flex-1" onClick={submit} disabled={busy}>
              {busy ? t("updates.reportSending") : t("updates.reportSubmit")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}