import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { DEFAULT_LANGUAGE, LANGUAGES, termTranslations, translations } from "./translations";

const LanguageContext = createContext(null);
const STORAGE_KEY = "engineering_hub_language";

const isSupported = (code) => LANGUAGES.some((language) => language.code === code);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isSupported(stored) ? stored : DEFAULT_LANGUAGE;
  });

  const changeLanguage = useCallback((code, { persist = true } = {}) => {
    if (!isSupported(code)) return;
    setLanguage(code);
    localStorage.setItem(STORAGE_KEY, code);
    // Remember the choice on the signed-in account too.
    if (persist) base44.auth.updateMe({ language: code }).catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  // A language saved on the account follows the student to any device.
  useEffect(() => {
    let cancelled = false;
    base44.auth
      .me()
      .then((user) => {
        if (!cancelled && isSupported(user?.language) && user.language !== localStorage.getItem(STORAGE_KEY)) {
          changeLanguage(user.language, { persist: false });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [changeLanguage]);

  const t = useCallback(
    (key, params) => {
      const dictionary = translations[language] || translations[DEFAULT_LANGUAGE];
      let value = dictionary[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key;
      if (params) {
        Object.entries(params).forEach(([name, replacement]) => {
          value = value.replace(`{{${name}}}`, replacement);
        });
      }
      return value;
    },
    [language]
  );

  // Display label for stored data values; the stored value itself never changes.
  const term = useCallback((value) => termTranslations[language]?.[value] ?? value, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, term, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
}