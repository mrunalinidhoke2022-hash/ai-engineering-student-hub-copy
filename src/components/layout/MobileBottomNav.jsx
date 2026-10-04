import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Wrench, Trophy, Hammer, Bookmark, Gamepad2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const ITEMS = [
  { labelKey: "nav.home", path: "/", icon: Home },
  { labelKey: "nav.tools", path: "/ai-tools", icon: Wrench },
  { labelKey: "nav.codequest", path: "/codequest", icon: Gamepad2 },
  { labelKey: "nav.hackathons", path: "/hackathon-hub", icon: Trophy },
  { labelKey: "nav.builder", path: "/project-builder", icon: Hammer },
  { labelKey: "nav.toolkit", path: "/toolkit", icon: Bookmark },
];

// Each tab keeps its own navigation stack so switching tabs and coming back
// restores where the user was. Re-tapping the active tab starts that tab over.
const tabStacks = new Map();

const isInTab = (pathname, tabPath) => (tabPath === "/" ? pathname === "/" : pathname.startsWith(tabPath));

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const activeTab = ITEMS.find((item) => isInTab(location.pathname, item.path));

  useEffect(() => {
    if (!activeTab) return;
    const stack = tabStacks.get(activeTab.path) || [];
    if (stack[stack.length - 1] !== location.pathname) stack.push(location.pathname);
    tabStacks.set(activeTab.path, stack.slice(-20));
  }, [location.pathname, activeTab?.path]);

  const handleTab = (item) => (event) => {
    event.preventDefault();
    if (activeTab?.path === item.path) {
      tabStacks.set(item.path, []);
      navigate(item.path);
      return;
    }
    const stack = tabStacks.get(item.path);
    navigate(stack?.length ? stack[stack.length - 1] : item.path);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-6">
        {ITEMS.map((item) => {
          const active = activeTab?.path === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleTab(item)}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 min-h-[56px] text-xs font-medium ${
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