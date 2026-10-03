import React from "react";
import { Link, useLocation } from "react-router-dom";
import PageTransition from "@/components/common/PageTransition";
import { Button } from "@/components/ui/button";
import SiteFooter from "./SiteFooter";
import BackButton from "./BackButton";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PUBLIC_LINKS = [
  { labelKey: "nav.home", path: "/" },
  { labelKey: "nav.about", path: "/about" },
  { labelKey: "nav.contact", path: "/contact" },
  { labelKey: "nav.team", path: "/team" },
];

export default function PublicLayout() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="font-heading font-extrabold text-lg tracking-tight text-foreground shrink-0">
            ENGINEERING HUB
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === link.path
                    ? "text-primary bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {t(link.labelKey)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher compact />
            <Link to="/login">
              <Button size="sm">{t("public.signIn")}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <BackButton />
        <PageTransition />
      </main>

      <SiteFooter />
    </div>
  );
}