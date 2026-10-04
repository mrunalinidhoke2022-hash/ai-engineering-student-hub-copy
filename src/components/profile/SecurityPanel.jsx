import React, { useEffect, useState } from "react";
import { KeyRound, Loader2, LogOut, Mail, Phone, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { describeError } from "@/lib/authErrors";
import SecurityStatusRow from "@/components/profile/SecurityStatusRow";

// Values are shown partially: enough for a student to recognise their own email or number,
// not enough for anyone looking over their shoulder to walk away with it.
const maskEmail = (value = "") => {
  const [name, domain] = value.split("@");
  if (!name || !domain) return value;
  return `${name.slice(0, 1)}${"•".repeat(Math.max(3, name.length - 1))}@${domain}`;
};

const maskMobile = (value = "") => (value.length === 10 ? `••••••${value.slice(-4)}` : value || "");

export default function SecurityPanel() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [profile, setProfile] = useState(undefined);
  const [busy, setBusy] = useState("");
  const [mobileState, setMobileState] = useState("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const loadProfile = async () => {
    if (!user?.id) return;
    const page = await base44.entities.StudentProfile.filter({ account_id: user.id }, { limit: 1 });
    setProfile(page.items[0] || null);
  };

  useEffect(() => {
    loadProfile();
  }, [user?.id]);

  // Changing the password goes through the platform's own reset link, so the new password is
  // never handled by this page.
  const sendResetLink = async () => {
    setError("");
    setBusy("password");
    try {
      await base44.auth.resetPasswordRequest(user.email);
    } catch {
      // The platform answers identically either way, so success is the only honest message.
    } finally {
      setBusy("");
      toast({ description: t("security.resetSent") });
    }
  };

  const sendCode = async () => {
    setError("");
    setBusy("send");
    try {
      const response = await base44.functions.invoke("sendMobileOtp", { mobile: profile?.mobile });
      const delivery = response?.data?.delivery;
      if (delivery === "sent") setMobileState("sent");
      else if (delivery === "already_verified") {
        setMobileState("verified");
        await loadProfile();
      } else setMobileState("unavailable");
    } catch (err) {
      const reason = err?.response?.data?.code;
      if (reason === "COOLDOWN" || reason === "TOO_MANY") setError(describeError(t, err, "otp.tooMany"));
      // No SMS gateway connected yet: say so rather than suggest a code is on its way.
      else setMobileState("unavailable");
    } finally {
      setBusy("");
    }
  };

  const verifyCode = async () => {
    setError("");
    setBusy("verify");
    try {
      const response = await base44.functions.invoke("verifyMobileOtp", {
        mobile: profile?.mobile,
        code: code.trim(),
      });
      if (response?.data?.verified) {
        setCode("");
        setMobileState("verified");
        await loadProfile();
        toast({ description: t("otp.verified") });
      } else {
        setError(describeError(t, response?.data, "otp.invalid"));
      }
    } catch (err) {
      setError(describeError(t, err, "otp.invalid"));
    } finally {
      setBusy("");
    }
  };

  if (profile === undefined) {
    return <p className="mt-6 text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  const mobileUnverified = Boolean(profile?.mobile) && !profile?.mobile_verified;
  const awaitingCode = mobileState === "sent";

  return (
    <div className="mt-6 rounded-lg border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> {t("security.title")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("security.subtitle")}</p>

      <div className="mt-3 divide-y divide-border">
        <SecurityStatusRow
          icon={Mail}
          label={t("security.email")}
          value={maskEmail(profile?.email || user?.email)}
          verified={Boolean(profile ? profile.email_verified : user?.email)}
        />
        <SecurityStatusRow
          icon={Phone}
          label={t("security.mobile")}
          value={maskMobile(profile?.mobile)}
          verified={Boolean(profile?.mobile_verified)}
        />
        <SecurityStatusRow
          icon={KeyRound}
          label={t("security.password")}
          value={t("security.masked")}
          verified
          verifiedKey="security.set"
        />
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {mobileState === "unavailable" ? (
        <div className="mt-4 rounded-lg bg-warning/10 p-3">
          <p className="text-xs font-semibold text-foreground">{t("register.mobile.notConfigured")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("register.mobile.notConfiguredDesc")}</p>
        </div>
      ) : null}

      {mobileState === "verified" ? (
        <p className="mt-4 text-xs font-semibold text-success">{t("register.mobile.verifiedMsg")}</p>
      ) : null}

      {awaitingCode ? (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">{t("security.verifyDesc")}</p>
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            aria-label={t("register.mobile.codeLabel")}
            className="h-12 text-center font-mono text-lg tracking-[0.4em]"
          />
          <div className="flex gap-2">
            <Button className="h-11 flex-1" onClick={verifyCode} disabled={busy === "verify" || code.length !== 6}>
              {busy === "verify" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("register.mobile.verifying")}
                </>
              ) : (
                t("register.mobile.verify")
              )}
            </Button>
            <Button variant="outline" className="h-11" onClick={sendCode} disabled={busy === "send"}>
              {t("register.mobile.send")}
            </Button>
          </div>
        </div>
      ) : null}

      {mobileUnverified && !awaitingCode && mobileState !== "unavailable" ? (
        <Button variant="outline" className="mt-4 h-11 w-full gap-2" onClick={sendCode} disabled={busy === "send"}>
          {busy === "send" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("register.mobile.sending")}
            </>
          ) : (
            <>
              <ShieldCheck className="h-4 w-4" />
              {t("security.verifyNow")}
            </>
          )}
        </Button>
      ) : null}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button variant="outline" className="h-11 flex-1 gap-2" onClick={sendResetLink} disabled={busy === "password"}>
          <KeyRound className="h-4 w-4" aria-hidden="true" /> {t("security.changePassword")}
        </Button>
        <Button
          variant="outline"
          className="h-11 flex-1 gap-2 text-destructive hover:text-destructive"
          onClick={() => base44.auth.logout("/login")}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> {t("security.logout")}
        </Button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">{t("security.allSessionsUnsupported")}</p>
    </div>
  );
}