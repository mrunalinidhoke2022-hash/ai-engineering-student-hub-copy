import React from "react";
import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// One shared frame for every signed-out screen: the branded navy backdrop, the language
// switcher, and a single card that holds whichever step the page is showing.
export default function AuthLayout({ icon: Icon, title, subtitle, footer, children, progress, wide = false }) {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-navy px-4 py-8 sm:py-12">
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.07]" aria-hidden="true" />
      <div
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-cyan/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-primary/25 blur-3xl"
        aria-hidden="true"
      />

      <div className={`relative mx-auto w-full ${wide ? "max-w-lg" : "max-w-md"}`}>
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center gap-2 text-brand-ink">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-brand-cyan/20 ring-1 ring-brand-ink/20">
              <Rocket className="h-5 w-5 text-brand-cyan" aria-hidden="true" />
            </span>
            <span className="font-heading text-lg font-extrabold tracking-tight">DEVLAUNCH</span>
          </Link>
          <LanguageSwitcher compact />
        </div>

        <div className="rounded-2xl border border-brand-ink/10 bg-card p-5 shadow-2xl sm:p-7">
          <div className="flex items-start gap-3">
            {Icon ? (
              <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
            ) : null}
            <div>
              <h1 className="font-heading text-2xl font-extrabold tracking-tight">{title}</h1>
              {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
          </div>

          {progress}

          <div className="mt-6">{children}</div>
        </div>

        {footer ? <p className="mt-6 text-center text-sm text-brand-ink-soft">{footer}</p> : null}

        <p className="mt-4 text-center text-xs text-brand-ink-soft">
          <Link to="/about" className="transition-colors hover:text-brand-ink">
            {t("auth.about")}
          </Link>
          <span className="mx-2">·</span>
          <Link to="/contact" className="transition-colors hover:text-brand-ink">
            {t("auth.contact")}
          </Link>
          <span className="mx-2">·</span>
          <Link to="/privacy" className="transition-colors hover:text-brand-ink">
            Privacy Policy
          </Link>
          <span className="mx-2">·</span>
          <Link to="/terms" className="transition-colors hover:text-brand-ink">
            Terms of Use
          </Link>
        </p>
      </div>
    </div>
  );
}