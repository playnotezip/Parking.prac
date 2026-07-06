"use client";

import { useState, useEffect } from "react";
import {
  translations,
  getClientLocale,
  setClientLocale,
  Locale,
  translate as translateFn,
} from "@/lib/i18n";

export function useI18n() {
  const [locale, setLocale] = useState<Locale>("en");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    const currentLocale = getClientLocale();
    setLocale(currentLocale);
    setIsLoaded(true);
  }, []);

  const changeLocale = (newLocale: Locale) => {
    setClientLocale(newLocale);
    setLocale(newLocale);
  };

  const translate = (key: keyof typeof translations.ko) => {
    return translateFn(key, locale);
  };

  return {
    locale,
    isLoaded,
    changeLocale,
    translate,
    t: translations[locale] || translations.en,
  };
}

