import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // Home is the starting point, so there is nothing to go back to there.
  if (location.pathname === "/") return null;

  // A page opened directly (shared link, refresh) has no in-app history to
  // return to, so those visitors go home instead of leaving the app.
  const cameFromApp = location.key !== "default";

  return (
    <div className="sticky top-[calc(4rem+env(safe-area-inset-top))] z-30 bg-background/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
        <button
          onClick={() => (cameFromApp ? navigate(-1) : navigate("/"))}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </button>
      </div>
    </div>
  );
}