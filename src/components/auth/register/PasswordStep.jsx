import React from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import PasswordField from "@/components/auth/PasswordField";

// Step 3 — the password, shown with the rules it has to meet and a strength gauge.
export default function PasswordStep({ form, setForm }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <PasswordField
        id="password"
        label={t("common.password")}
        value={form.password}
        onChange={(value) => setForm({ ...form, password: value })}
        autoFocus
        showRules
      />
      <PasswordField
        id="confirmPassword"
        label={t("common.confirmPassword")}
        value={form.confirmPassword}
        onChange={(value) => setForm({ ...form, confirmPassword: value })}
      />
    </div>
  );
}