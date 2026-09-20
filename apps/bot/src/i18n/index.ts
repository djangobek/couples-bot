/* ============================================================
   BOT i18n — Engine
   ============================================================ */

import { uz, type BotTranslations } from "./uz.js";
import { ru } from "./ru.js";
import { en } from "./en.js";

export type Lang = "uz" | "ru" | "en";

const translations: Record<Lang, BotTranslations> = {
  uz,
  ru,
  en,
};

/* ---------- Detect language from Telegram ---------- */
export function detectLanguage(
  telegramLangCode: string | undefined,
  fallback: Lang = "uz",
): Lang {
  if (!telegramLangCode) return fallback;
  const code = telegramLangCode.toLowerCase().slice(0, 2);
  if (code === "uz") return "uz";
  if (code === "ru") return "ru";
  if (code === "en") return "en";
  return fallback;
}

/* ---------- Translate ---------- */
export function t(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const parts = key.split(".");
  let value: unknown = translations[lang] ?? translations.uz;

  for (const part of parts) {
    if (
      value &&
      typeof value === "object" &&
      part in (value as Record<string, unknown>)
    ) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  if (typeof value !== "string") return key;

  if (vars) {
    return value.replace(/\{(\w+)\}/g, (_, name: string) => {
      const v = vars[name];
      return v !== undefined ? String(v) : `{${name}}`;
    });
  }

  return value;
}

/* ---------- Type-safe getter ---------- */
export function getTranslations(lang: Lang): BotTranslations {
  return translations[lang] ?? translations.uz;
}

export { type BotTranslations } from "./uz.js";