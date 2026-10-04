import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const CATEGORIES = [
  "ai_tools",
  "developer_tools",
  "coding_platforms",
  "learning_resources",
  "engineering_technology",
  "hackathons",
  "competitions",
  "announcements",
  "tutorials",
];

const FREQUENCIES = [
  { hours: 24, key: "every24" },
  { hours: 48, key: "every48" },
  { hours: 168, key: "everyWeek" },
];

const DEFAULTS = {
  enabled: true,
  frequency_hours: 24,
  categories: CATEGORIES,
  weekly_categories: ["learning_resources", "engineering_technology", "tutorials"],
  auto_publish_low_risk: false,
  notify_students: true,
};

// A row that reads as a switch but is a plain button — no hidden state, works with a keyboard.
function ToggleRow({ label, description, value, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="w-full min-h-[56px] flex items-start justify-between gap-4 text-left p-3.5 rounded-lg border border-border hover:bg-secondary"
    >
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {description ? <span className="block text-xs text-muted-foreground mt-0.5">{description}</span> : null}
      </span>
      <span className={`mt-0.5 shrink-0 w-11 h-6 rounded-full p-0.5 transition-colors ${value ? "bg-primary" : "bg-secondary border border-border"}`}>
        <span className={`block w-5 h-5 rounded-full bg-background shadow transition-transform ${value ? "translate-x-5" : ""}`} />
      </span>
    </button>
  );
}

// Admin control over the automatic updates: whether they run at all, how often, which categories,
// whether low-risk updates publish themselves, and whether students get told.
export default function UpdateSettingsPanel({ settings, onSaved }) {
  const [form, setForm] = useState({ ...DEFAULTS, ...(settings || {}) });
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (settings) setForm((current) => ({ ...current, ...settings }));
  }, [settings]);

  const toggleIn = (list, value) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  const save = async () => {
    setBusy(true);
    try {
      const payload = {
        enabled: form.enabled !== false,
        frequency_hours: Number(form.frequency_hours) || 24,
        categories: form.categories?.length ? form.categories : CATEGORIES,
        weekly_categories: form.weekly_categories || [],
        auto_publish_low_risk: form.auto_publish_low_risk === true,
        notify_students: form.notify_students !== false,
      };
      if (form.id) await base44.entities.AutoUpdateSetting.update(form.id, payload);
      else await base44.entities.AutoUpdateSetting.create({ label: "default", ...payload });
      toast({ description: t("adminUpdates.settings.saved") });
      onSaved?.();
    } catch {
      toast({ description: t("errors.generic"), variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <ToggleRow
        label={t("adminUpdates.settings.autoUpdates")}
        description={t("adminUpdates.settings.autoUpdatesDesc")}
        value={form.enabled !== false}
        onChange={(value) => setForm({ ...form, enabled: value })}
      />
      <ToggleRow
        label={t("adminUpdates.settings.autoPublish")}
        description={t("adminUpdates.settings.autoPublishDesc")}
        value={form.auto_publish_low_risk === true}
        onChange={(value) => setForm({ ...form, auto_publish_low_risk: value })}
      />
      <ToggleRow
        label={t("adminUpdates.settings.notify")}
        description={t("adminUpdates.settings.notifyDesc")}
        value={form.notify_students !== false}
        onChange={(value) => setForm({ ...form, notify_students: value })}
      />

      <div className="bg-card border border-border rounded-lg p-4">
        <p className="text-sm font-semibold">{t("adminUpdates.settings.frequency")}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {FREQUENCIES.map((option) => (
            <button
              key={option.hours}
              type="button"
              onClick={() => setForm({ ...form, frequency_hours: option.hours })}
              className={`min-h-[40px] text-xs font-semibold px-3 rounded-full border ${
                Number(form.frequency_hours) === option.hours
                  ? "border-primary bg-accent text-primary"
                  : "border-border text-muted-foreground hover:bg-secondary"
              }`}
            >
              {t(`adminUpdates.settings.${option.key}`)}
            </button>
          ))}
        </div>

        <p className="text-sm font-semibold mt-4">{t("adminUpdates.settings.weekly")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("adminUpdates.settings.weeklyDesc")}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {CATEGORIES.map((category) => {
            const on = (form.weekly_categories || []).includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => setForm({ ...form, weekly_categories: toggleIn(form.weekly_categories || [], category) })}
                className={`min-h-[36px] text-xs font-semibold px-3 rounded-full border ${
                  on ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t(`adminUpdates.cat.${category}`)}
              </button>
            );
          })}
        </div>

        <p className="text-sm font-semibold mt-4">{t("adminUpdates.settings.categories")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{t("adminUpdates.settings.categoriesDesc")}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {CATEGORIES.map((category) => {
            const on = (form.categories || []).includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => setForm({ ...form, categories: toggleIn(form.categories || [], category) })}
                className={`min-h-[36px] text-xs font-semibold px-3 rounded-full border ${
                  on ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t(`adminUpdates.cat.${category}`)}
              </button>
            );
          })}
        </div>
      </div>

      <Button className="w-full min-h-[44px]" onClick={save} disabled={busy}>
        {busy ? t("common.saving") : t("adminUpdates.settings.save")}
      </Button>
    </div>
  );
}