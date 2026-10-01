import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wrench, Trophy, Hammer, Bookmark } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const ITEMS = [
  { labelKey: "nav.home", path: "/", icon: Home },
  { labelKey: "nav.tools", path: "/ai-tools", icon: Wrench },
  { labelKey: "nav.hackathons", path: "/hackathon-hub", icon: Trophy },
  { labelKey: "nav.builder", path: "/project-builder", icon: Hammer },
  { labelKey: "nav.toolkit", path: "/toolkit", icon: Bookmark },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {ITEMS.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-[11px] font-medium ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}