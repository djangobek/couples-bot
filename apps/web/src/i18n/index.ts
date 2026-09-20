/* ============================================================
   WEB i18n — Engine
   ============================================================ */

import { uz, type WebTranslations } from "./uz";
import { ru } from "./ru";
import { en } from "./en";

export type Lang = "uz" | "ru" | "en";

const translations: Record<Lang, WebTranslations> = {
  uz,
  ru,
  en,
};

const STORAGE_KEY = "couples_lang";

/* ---------- Detect language ---------- */
export function detectLanguage(
  telegramLangCode?: string | null,
): Lang {
  /* 1. Stored preference */
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "uz" || stored === "ru" || stored === "en") {
      return stored;
    }
  } catch {
    /* ignore */
  }

  /* 2. Telegram language */
  if (telegramLangCode) {
    const code = telegramLangCode.toLowerCase().slice(0, 2);
    if (code === "uz") return "uz";
    if (code === "ru") return "ru";
    if (code === "en") return "en";
  }

  return "uz";
}

/* ---------- Save preference ---------- */
export function saveLanguage(lang: Lang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
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

export function getTranslations(lang: Lang): WebTranslations {
  return translations[lang] ?? translations.uz;
}

export { type WebTranslations } from "./uz";