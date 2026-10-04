import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, Bookmark, LayoutDashboard, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import BeginnerModeToggle from "./BeginnerModeToggle";
import NotificationPanel from "@/components/notifications/NotificationPanel";
import CircularMenu from "./CircularMenu";
import GlobalSearchDialog from "@/components/search/GlobalSearchDialog";

const NAV_LINKS = [
  { labelKey: "nav.home", path: "/" },
  { labelKey: "nav.aiTools", path: "/ai-tools" },
  { labelKey: "nav.learn", path: "/learn" },
  { labelKey: "nav.coding", path: "/coding-practice" },
  { labelKey: "nav.codequest", path: "/codequest" },
  { labelKey: "nav.leaderboard", path: "/leaderboard" },
  { labelKey: "nav.hackathons", path: "/hackathon-hub" },
  { labelKey: "nav.projectBuilder", path: "/project-builder" },
  { labelKey: "nav.prompts", path: "/prompts" },
  { labelKey: "nav.team", path: "/team" },
  { labelKey: "nav.workspace", path: "/workspace" },
];

export default function SiteHeader({ user, isAdmin }) {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="font-heading font-extrabold text-lg tracking-tight text-foreground shrink-0">
          DEVLAUNCH
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
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

        <div className="hidden lg:flex items-center gap-2 shrink-0">
          <GlobalSearchDialog />
          <LanguageSwitcher />
          <NotificationPanel user={user} />
          <BeginnerModeToggle user={user} />
          <Link to="/toolkit">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Bookmark className="w-4 h-4" /> {t("nav.myToolkit")}
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" size="sm" className="gap-1.5">
              <LayoutDashboard className="w-4 h-4" /> {t("nav.dashboard")}
            </Button>
          </Link>
          {isAdmin && (
            <Link to="/admin">
              <Button size="sm" className="gap-1.5 bg-foreground text-white hover:bg-foreground/90">
                {t("nav.admin")}
              </Button>
            </Link>
          )}
          <button
            onClick={() => base44.auth.logout("/login")}
            className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary"
            aria-label={t("nav.logout")}
            title={t("nav.logout")}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="lg:hidden flex items-center gap-2">
          <GlobalSearchDialog />
          <LanguageSwitcher compact />
          <NotificationPanel user={user} />
          <CircularMenu user={user} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}