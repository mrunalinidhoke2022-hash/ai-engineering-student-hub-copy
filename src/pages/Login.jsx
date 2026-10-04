import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, LogIn, Mail } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import PasswordField from "@/components/auth/PasswordField";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { describeError } from "@/lib/authErrors";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Post-login destination (e.g. the MCP OAuth consent page sends users here
  // with returnTo so the grant flow can resume). Same-origin paths only.
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loginId = identifier.trim();
      if (loginId.includes("@")) {
        await base44.auth.loginViaEmailPassword(loginId, password);
      } else {
        // Mobile number / User ID sign-in is verified on the server, which answers with a
        // session token and never with the account's email address.
        const signIn = await base44.functions.invoke("loginWithIdentifier", {
          identifier: loginId,
          password,
        });
        if (!signIn.data?.access_token) {
          setError(describeError(t, signIn.data, "errors.invalidCredentials"));
          return;
        }
        base44.auth.setToken(signIn.data.access_token);
      }
      window.location.href = returnTo;
    } catch (err) {
      setError(describeError(t, err, "errors.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", returnTo);
  };

  return (
    <AuthLayout
      icon={LogIn}
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <>
          {t("auth.login.noAccount")}{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="font-medium text-brand-ink hover:underline"
          >
            {t("auth.login.createOne")}
          </Link>
        </>
      }
    >
      <Button variant="outline" className="mb-5 h-12 w-full text-sm font-medium" onClick={handleGoogle}>
        <GoogleIcon className="mr-2 h-5 w-5" />
        {t("auth.login.google")}
      </Button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t("common.or")}</span>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">{t("auth.login.identifier")}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              autoFocus
              placeholder={t("auth.login.identifierPlaceholder")}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="h-12 pl-10"
              required
            />
          </div>
        </div>

        <PasswordField
          id="password"
          label={t("common.password")}
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          right={
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              {t("auth.login.forgot")}
            </Link>
          }
        />

        <Button type="submit" className="h-12 w-full font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("auth.login.submitting")}
            </>
          ) : (
            t("auth.login.submit")
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}