import React, { useState } from "react";
import { GraduationCap } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function BeginnerModeToggle({ user }) {
  const [enabled, setEnabled] = useState(user?.beginner_mode !== false);
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    try {
      await base44.auth.updateMe({ beginner_mode: next });
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        enabled ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-secondary text-muted-foreground border-border"
      }`}
      title={t("beginner.title")}
    >
      <GraduationCap className="w-3.5 h-3.5" />
      {enabled ? t("beginner.on") : t("beginner.off")}
    </button>
  );
}