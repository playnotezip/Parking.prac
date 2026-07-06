"use client";

import { useI18n } from "@/hooks/useI18n";

export default function I18NPage() {
  const { locale, t, changeLocale, isLoaded } = useI18n();

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-6">{t.welcome}</h1>
        <p className="mb-4">{t.hello}</p>
        <p className="mb-4">{t.description}</p>
        <p className="mb-4">
          {t.current_locale}: <strong>{locale}</strong>
        </p>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">{t.change_language}</h2>
          <div className="flex gap-4">
            <button
              onClick={() => changeLocale("ko")}
              className={`px-4 py-2 rounded ${
                locale === "ko" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              한국어
            </button>
            <button
              onClick={() => changeLocale("en")}
              className={`px-4 py-2 rounded ${
                locale === "en" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              English
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

