import React from "react";
import { Check, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function LanguageSwitcher({ compact = false }) {
  const { language, setLanguage, languages, t } = useLanguage();
  const current = languages.find((item) => item.code === language) || languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("language.switch")}
          title={t("language.title")}
          className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border bg-card text-xs font-semibold text-foreground hover:bg-secondary transition-colors shrink-0"
        >
          <Globe className="w-4 h-4 text-muted-foreground" />
          {compact ? current.code.toUpperCase() : current.native}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>{t("language.title")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((item) => (
          <DropdownMenuItem key={item.code} onSelect={() => setLanguage(item.code)} className="gap-2">
            <span className="flex-1">{item.native}</span>
            {item.code === language && <Check className="w-4 h-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}