import React from "react";
import { BadgeCheck, Loader2, MessageSquareCode, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Step 5 — the mobile code. When the SMS gateway is not connected yet this step says so plainly
// and lets the student move on, because a number can be verified later from Profile → Security.
export default function MobileCodeStep({
  mobile,
  state,
  busy,
  code,
  setCode,
  onSend,
  onVerify,
  onContinue,
  onChangeMobile,
  attemptsLeft,
}) {
  const { t } = useLanguage();
  const unavailable = state === "unavailable";
  const verified = state === "verified";
  const awaitingCode = state === "sent";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("register.mobile.desc")} <span className="font-semibold text-foreground">{mobile}</span>
      </p>

      {unavailable ? (
        <div className="rounded-lg bg-warning/10 p-3">
          <p className="text-xs font-semibold text-foreground">{t("register.mobile.notConfigured")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("register.mobile.notConfiguredDesc")}</p>
        </div>
      ) : null}

      {verified ? (
        <p className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 p-3 text-xs font-semibold text-success">
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          {t("register.mobile.verifiedMsg")}
        </p>
      ) : null}

      {awaitingCode ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onVerify();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="mobileCode">{t("register.mobile.codeLabel")}</Label>
            <Input
              id="mobileCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              className="h-12 text-center font-mono text-lg tracking-[0.4em]"
              required
            />
            {attemptsLeft !== null && attemptsLeft !== undefined ? (
              <p className="text-xs text-muted-foreground">{t("register.mobile.attemptsLeft", { count: attemptsLeft })}</p>
            ) : null}
          </div>
          <Button type="submit" className="h-12 w-full font-medium" disabled={busy || code.length !== 6}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("register.mobile.verifying")}
              </>
            ) : (
              <>
                <ShieldCheck className="mr-2 h-4 w-4" />
                {t("register.mobile.verify")}
              </>
            )}
          </Button>
        </form>
      ) : null}

      {!awaitingCode && !verified ? (
        <Button className="h-12 w-full font-medium" onClick={unavailable ? onContinue : onSend} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("register.mobile.sending")}
            </>
          ) : unavailable ? (
            t("register.mobile.skip")
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              {t("register.mobile.send")}
            </>
          )}
        </Button>
      ) : null}

      {verified ? (
        <Button className="h-12 w-full font-medium" onClick={onContinue} disabled={busy}>
          {t("common.continue")}
        </Button>
      ) : null}

      <div className="flex items-center justify-between text-sm">
        <button type="button" className="text-primary hover:underline" onClick={onChangeMobile}>
          {t("register.mobile.changeMobile")}
        </button>
        {awaitingCode ? (
          <button type="button" className="inline-flex items-center gap-1 text-primary hover:underline" onClick={onSend}>
            <MessageSquareCode className="h-3.5 w-3.5" aria-hidden="true" />
            {t("register.mobile.send")}
          </button>
        ) : null}
      </div>
    </div>
  );
}