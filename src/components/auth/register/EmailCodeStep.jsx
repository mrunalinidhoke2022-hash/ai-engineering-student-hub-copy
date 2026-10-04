import React from "react";
import { Loader2, MailCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Step 4 — the platform's own email code. The account already exists at this point but stays
// unusable until this code is verified, so nothing is reachable before the address is proved.
export default function EmailCodeStep({ email, code, setCode, onSubmit, onResend, onBack, busy, resendIn }) {
  const { t } = useLanguage();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="rounded-lg bg-secondary/60 p-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          <MailCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          {t("register.email.desc", { email })}
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="emailCode">{t("register.email.codeLabel")}</Label>
        <Input
          id="emailCode"
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
      </div>

      <Button type="submit" className="h-12 w-full font-medium" disabled={busy || code.length !== 6}>
        {busy ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("register.email.verifying")}
          </>
        ) : (
          <>
            <ShieldCheck className="mr-2 h-4 w-4" />
            {t("register.email.verify")}
          </>
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button type="button" className="text-primary hover:underline" onClick={onBack}>
          {t("register.email.changeEmail")}
        </button>
        <button
          type="button"
          className="text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
          onClick={onResend}
          disabled={resendIn > 0}
        >
          {resendIn > 0 ? t("register.email.resendIn", { seconds: resendIn }) : t("register.email.resend")}
        </button>
      </div>
    </form>
  );
}