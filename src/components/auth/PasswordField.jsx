import React, { useState } from "react";
import { Check, Eye, EyeOff, Lock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { PASSWORD_RULES, passwordStrength } from "@/lib/registration";

const STRENGTH_WIDTH = { 1: "w-1/4", 2: "w-2/4", 3: "w-3/4", 4: "w-full" };
const STRENGTH_COLOR = { 1: "bg-destructive", 2: "bg-warning", 3: "bg-primary", 4: "bg-success" };

export default function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete = "new-password",
  autoFocus = false,
  showRules = false,
  right,
}) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const strength = passwordStrength(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label || t("common.password")}</Label>
        {right}
      </div>

      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
        <Input
          id={id}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10 pr-11 h-12"
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? t("pw.hide") : t("pw.show")}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {value ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{t("pw.strength")}</span>
            <span className="font-semibold text-foreground">{t(strength.key)}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div className={`h-full rounded-full transition-all ${STRENGTH_WIDTH[strength.level]} ${STRENGTH_COLOR[strength.level]}`} />
          </div>
        </div>
      ) : null}

      {showRules ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(value || "");
            return (
              <li key={rule.key} className={`flex items-center gap-1.5 text-xs ${met ? "text-success" : "text-muted-foreground"}`}>
                {met ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                {t(rule.key)}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}