import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  LogOut,
  Home,
  Wrench,
  BookOpen,
  Code2,
  Trophy,
  Hammer,
  Sparkles,
  MessageCircle,
  Users,
  Briefcase,
  LayoutDashboard,
  Bookmark,
  User,
  Info,
  Mail,
  Shield,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import BeginnerModeToggle from "./BeginnerModeToggle";

// Every page in the app sits on the wheel, so no destination takes more than
// one tap on a phone or tablet.
const PAGE_LINKS = [
  { labelKey: "nav.home", path: "/", icon: Home },
  { labelKey: "nav.aiTools", path: "/ai-tools", icon: Wrench },
  { labelKey: "nav.learn", path: "/learn", icon: BookOpen },
  { labelKey: "nav.coding", path: "/coding-practice", icon: Code2 },
  { labelKey: "nav.hackathons", path: "/hackathon-hub", icon: Trophy },
  { labelKey: "nav.builder", path: "/project-builder", icon: Hammer },
  { labelKey: "nav.prompts", path: "/prompts", icon: Sparkles },
  { labelKey: "nav.mentor", path: "/mentor", icon: MessageCircle },
  { labelKey: "nav.team", path: "/team", icon: Users },
  { labelKey: "nav.workspace", path: "/workspace", icon: Briefcase },
  { labelKey: "nav.dashboard", path: "/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.toolkit", path: "/toolkit", icon: Bookmark },
  { labelKey: "nav.profile", path: "/profile", icon: User },
  { labelKey: "nav.about", path: "/about", icon: Info },
  { labelKey: "nav.contact", path: "/contact", icon: Mail },
];

// The inner ring is drawn at this fraction of the outer radius.
const INNER_RATIO = 0.62;

export default function CircularMenu({ user, isAdmin }) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const [metrics, setMetrics] = useState({ radius: 130, compact: false });
  const location = useLocation();

  const entries = [
    ...(isAdmin ? [...PAGE_LINKS, { labelKey: "nav.admin", path: "/admin", icon: Shield }] : PAGE_LINKS),
    { labelKey: "nav.logout", icon: LogOut, destructive: true, action: () => base44.auth.logout("/login") },
  ];

  // Never leave the menu hanging over a page after navigating.
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const openMenu = () => {
    const { innerWidth: width, innerHeight: height } = window;
    const perRing = Math.ceil(entries.length / 2);
    // Fit roughly 56px of arc per tab on the tighter inner ring so the labels never collide.
    const needed = (perRing * 56) / (2 * Math.PI * INNER_RATIO);
    const limit = Math.min(width / 2 - 34, height * 0.3);
    setMetrics({ radius: Math.max(96, Math.min(needed, limit)), compact: width < 400 });
    setOpen(true);
  };

  const close = () => setOpen(false);

  const perRing = Math.ceil(entries.length / 2);
  const rings = [entries.slice(0, perRing), entries.slice(perRing)].filter((ring) => ring.length > 0);
  const radii = rings.length === 1 ? [metrics.radius] : [metrics.radius * INNER_RATIO, metrics.radius];

  const sizeClass = metrics.compact ? "w-9 h-9" : "w-11 h-11";
  const iconClass = metrics.compact ? "w-4 h-4" : "w-5 h-5";
  const labelClass = `mt-1 block truncate text-center font-medium ${
    metrics.compact ? "w-12 text-[9px]" : "w-16 text-[10px]"
  }`;

  return (
    <>
      <button
        type="button"
        onClick={openMenu}
        className="w-9 h-9 rounded-full bg-primary text-primary-foreground shadow-sm flex items-center justify-center transition-transform active:scale-95"
        aria-label={t("nav.openMenu")}
        aria-expanded={open}
      >
        <Menu className="w-5 h-5" />
      </button>

      {open &&
        createPortal(
          <div className="lg:hidden fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t("nav.pageMenu")}>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.16 }}
              className="absolute inset-0 bg-background/95 backdrop-blur-sm"
              onClick={close}
              aria-label={t("nav.closeMenu")}
            />

            <p className="absolute top-[calc(env(safe-area-inset-top)+1rem)] left-4 right-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("nav.jump")}
            </p>

            <div className="absolute inset-x-0 top-[47%] h-0 flex justify-center">
              <div className="relative">
                <button
                  type="button"
                  onClick={close}
                  className={`absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg ${
                    metrics.compact ? "w-10 h-10" : "w-12 h-12"
                  }`}
                  aria-label={t("nav.closeMenu")}
                >
                  <X className={metrics.compact ? "w-4 h-4" : "w-5 h-5"} />
                </button>

                {rings.map((ring, ringIndex) =>
                  ring.map((entry, i) => {
                    const angle = ((-90 + i * (360 / ring.length)) * Math.PI) / 180;
                    const x = Math.cos(angle) * radii[ringIndex];
                    const y = Math.sin(angle) * radii[ringIndex];
                    const Icon = entry.icon;
                    const active = entry.path && location.pathname === entry.path;

                    const circle = `${sizeClass} rounded-full flex items-center justify-center border shadow-lg ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : entry.destructive
                          ? "bg-card text-destructive border-border"
                          : "bg-card text-foreground border-border"
                    }`;
                    const label = `${labelClass} ${
                      active ? "text-primary" : entry.destructive ? "text-destructive" : "text-muted-foreground"
                    }`;

                    const body = (
                      <>
                        <span className={circle}>
                          <Icon className={iconClass} />
                        </span>
                        <span className={label}>{t(entry.labelKey)}</span>
                      </>
                    );

                    return (
                      <div
                        key={`${entry.labelKey}-${i}`}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${x}px`, top: `${y}px` }}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (ringIndex * ring.length + i) * 0.02, duration: 0.18 }}
                        >
                          {entry.path ? (
                            <Link to={entry.path} onClick={close} className="flex flex-col items-center">
                              {body}
                            </Link>
                          ) : (
                            <button type="button" onClick={entry.action} className="flex flex-col items-center">
                              {body}
                            </button>
                          )}
                        </motion.div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="absolute bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 flex justify-center">
              <BeginnerModeToggle user={user} />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}