/* ============================================================
   WEB i18n — O'ZBEK TILI (uz)
   ASOSIY fayl — type shu yerdan olinadi
   ============================================================ */

/* ---------- Type (structure only) ---------- */
export type WebTranslations = {
  common: {
    yes: string;
    no: string;
    back: string;
    close: string;
    cancel: string;
    save: string;
    loading: string;
    error: string;
    retry: string;
    notFound: string;
    noData: string;
    search: string;
  };
  tabs: {
    home: string;
    games: string;
    world: string;
    profile: string;
  };
  subscription: {
    title: string;
    description: string;
    subscribe: string;
    check: string;
    checking: string;
    notSubscribed: string;
    subscribed: string;
    checkFailed: string;
    subscribeTo: string;
    goToChannel: string;
  };
  settings: {
    title: string;
    language: string;
    theme: string;
    themeDark: string;
    themeLight: string;
    notifications: string;
    about: string;
    version: string;
    logout: string;
  };
  language: {
    title: string;
    uz: string;
    ru: string;
    en: string;
    changed: string;
  };
};

/* ---------- Uzbek translation ---------- */
export const uz: WebTranslations = {
  common: {
    yes: "Ha",
    no: "Yo'q",
    back: "Orqaga",
    close: "Yopish",
    cancel: "Bekor qilish",
    save: "Saqlash",
    loading: "Yuklanmoqda…",
    error: "Xatolik yuz berdi",
    retry: "Qayta urinish",
    notFound: "Topilmadi",
    noData: "Ma'lumot yo'q",
    search: "Qidirish…",
  },
  tabs: {
    home: "Home",
    games: "O'yinlar",
    world: "Bizning dunyo",
    profile: "Profil",
  },
  subscription: {
    title: "Majburiy obuna",
    description:
      "Ilovadan foydalanish uchun quyidagi kanallarga obuna bo'ling:",
    subscribe: "➕ Obuna bo'lish",
    check: "✅ Tekshirish",
    checking: "Tekshirilmoqda…",
    notSubscribed: "Siz hali barcha kanallarga obuna bo'lmadingiz",
    subscribed: "Rahmat! Obuna tasdiqlandi",
    checkFailed: "Obunani tekshirib bo'lmadi. Qayta urinib ko'ring",
    subscribeTo: "Obuna bo'lish",
    goToChannel: "Kanalga o'tish",
  },
  settings: {
    title: "Sozlamalar",
    language: "Til",
    theme: "Mavzu",
    themeDark: "Tungi",
    themeLight: "Kunduzgi",
    notifications: "Bildirishnomalar",
    about: "Ilova haqida",
    version: "Versiya",
    logout: "Chiqish",
  },
  language: {
    title: "Tilni tanlang",
    uz: "🇺🇿 O'zbekcha",
    ru: "🇷🇺 Русский",
    en: "🇬🇧 English",
    changed: "Til o'zgartirildi",
  },
};