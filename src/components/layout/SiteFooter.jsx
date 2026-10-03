import React from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const LINKS = [
  { labelKey: "nav.about", path: "/about" },
  { labelKey: "nav.contact", path: "/contact" },
  { labelKey: "footer.meetTeam", path: "/team" },
  { labelKey: "footer.aiToolsDirectory", path: "/ai-tools" },
];

export const CONTACT_EMAIL = "mrunaltech9@gmail.com";

export default function SiteFooter() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid gap-8 sm:grid-cols-3">
        <div>
          <p className="font-heading font-extrabold text-lg tracking-tight">ENGINEERING HUB</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">{t("footer.tagline")}</p>
        </div>

        <div>
          <p className="font-heading font-bold text-sm">{t("footer.explore")}</p>
          <ul className="mt-3 space-y-2">
            {LINKS.map((link) => (
              <li key={link.path}>
                <Link to={link.path} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-heading font-bold text-sm">{t("footer.getInTouch")}</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-3"
          >
            <Mail className="w-4 h-4" /> {CONTACT_EMAIL}
          </a>
        </div>
      </div>

      <div className="border-t border-border pb-16 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} MrunalTech · DevLaunch / TechNova'26</span>
          <div className="flex items-center gap-4">
            <Link to="/about" className="hover:text-primary transition-colors">{t("nav.about")}</Link>
            <Link to="/contact" className="hover:text-primary transition-colors">{t("nav.contact")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}