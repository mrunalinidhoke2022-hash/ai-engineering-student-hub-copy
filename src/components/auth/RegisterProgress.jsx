import React from "react";
import { Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// The six registration steps, with the ones already finished ticked off. Names come from the
// translation catalogue, so the whole strip follows the reader's language.
export default function RegisterProgress({ keys, current }) {
  const { t } = useLanguage();

  return (
    <ol className="mt-5 space-y-2" aria-label={t("common.step", { current: current + 1, total: keys.length })}>
      <div className="flex items-center gap-1.5">
        {keys.map((key, index) => (
          <span
            key={key}
            className={`h-1.5 flex-1 rounded-full ${
              index < current ? "bg-success" : index === current ? "bg-primary" : "bg-secondary"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
          {current > 0 && <Check className="w-3.5 h-3.5 text-success" />}
          {t(`register.progress.${keys[current]}`)}
        </span>
        <span>{t("common.step", { current: current + 1, total: keys.length })}</span>
      </div>
    </ol>
  );
}