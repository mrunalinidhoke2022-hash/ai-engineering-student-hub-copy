import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, Loader2, Lock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";
import PasswordField from "@/components/auth/PasswordField";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { describeError } from "@/lib/authErrors";
import { passwordMeetsRules } from "@/lib/registration";

export default function ResetPassword() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!passwordMeetsRules(newPassword)) {
      setError(t("register.password.errWeak"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("register.password.errMismatch"));
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(describeError(t, err));
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title={t("reset.invalidTitle")}
        subtitle={t("reset.invalidSubtitle")}
        footer={
          <Link to="/forgot-password" className="font-medium text-brand-ink hover:underline">
            {t("reset.requestNew")}
          </Link>
        }
      >
        <p className="text-center text-sm text-foreground">{t("reset.invalidDesc")}</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={Lock} title={t("reset.title")} subtitle={t("reset.subtitle")}>
      {error ? (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      ) : null}
      <form onSubmit={handleSubmit} className="space-y-4">
        <PasswordField
          id="password"
          label={t("common.password")}
          value={newPassword}
          onChange={setNewPassword}
          autoFocus
          showRules
        />
        <PasswordField
          id="confirm"
          label={t("common.confirmPassword")}
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("reset.submitting")}
            </>
          ) : (
            t("reset.submit")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}