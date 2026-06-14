"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { LanguageType, translations } from "@/app/constants/languages";

interface LanguageContextType {
  language: LanguageType;
  setLanguage: (lang: LanguageType) => void;
  t: typeof translations["en"];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageType>("en");

  // Load user's saved preference from browser storage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("app_lang") as LanguageType;
    if (savedLang && (savedLang === "en" || savedLang === "zh-hans" || savedLang === "zh-hant")) {
      setLanguageState(savedLang);
    }
  }, []);

  const setLanguage = (lang: LanguageType) => {
    setLanguageState(lang);
    localStorage.setItem("app_lang", lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  
  if (!context) {
    // Return a dummy safe template representation to insulate next build pre-rendering workers
    console.warn("⚠️ [useLanguage] Context not found. Returning safe English default fallback strings.")
    return {
      language: "en" as LanguageType,
      setLanguage: () => {},
      t: translations["en"]
    }
  }
  
  return context
}

