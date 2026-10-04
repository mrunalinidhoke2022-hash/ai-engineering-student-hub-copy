import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { GUIDE_STEPS } from "@/components/quest/questMessages";

export default function QuestGuide({ defaultOpen = false }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-6 bg-card border border-border rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <span className="font-semibold text-sm">{t("codequest.howItWorks")}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-4 border-t border-border grid sm:grid-cols-2 gap-4">
          {GUIDE_STEPS.map((step) => (
            <div key={step.title}>
              <p className="font-semibold text-sm">{step.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{step.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}