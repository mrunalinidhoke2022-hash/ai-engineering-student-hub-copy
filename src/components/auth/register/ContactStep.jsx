import React from "react";
import { Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Step 2 — the two contact details that identify the account, each usable by one account only.
export default function ContactStep({ form, setForm, invalidField }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("common.email")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            placeholder="you@example.com"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className={`h-12 pl-10 ${invalidField === "email" ? "border-destructive" : ""}`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mobile">{t("common.mobile")}</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="98765 43210"
            value={form.mobile}
            onChange={(event) => setForm({ ...form, mobile: event.target.value })}
            className={`h-12 pl-10 ${invalidField === "mobile" ? "border-destructive" : ""}`}
          />
        </div>
        <p className="text-xs text-muted-foreground">{t("register.contact.desc")}</p>
      </div>
    </div>
  );
}