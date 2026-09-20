/* ============================================================
   BOT i18n — Engine
   ============================================================ */
import { uz } from "./uz.js";
import { ru } from "./ru.js";
import { en } from "./en.js";
const translations = {
    uz,
    ru,
    en,
};
/* ---------- Detect language from Telegram ---------- */
export function detectLanguage(telegramLangCode, fallback = "uz") {
    if (!telegramLangCode)
        return fallback;
    const code = telegramLangCode.toLowerCase().slice(0, 2);
    if (code === "uz")
        return "uz";
    if (code === "ru")
        return "ru";
    if (code === "en")
        return "en";
    return fallback;
}
/* ---------- Translate ---------- */
export function t(lang, key, vars) {
    const parts = key.split(".");
    let value = translations[lang] ?? translations.uz;
    for (const part of parts) {
        if (value &&
            typeof value === "object" &&
            part in value) {
            value = value[part];
        }
        else {
            return key;
        }
    }
    if (typeof value !== "string")
        return key;
    if (vars) {
        return value.replace(/\{(\w+)\}/g, (_, name) => {
            const v = vars[name];
            return v !== undefined ? String(v) : `{${name}}`;
        });
    }
    return value;
}
/* ---------- Type-safe getter ---------- */
export function getTranslations(lang) {
    return translations[lang] ?? translations.uz;
}
