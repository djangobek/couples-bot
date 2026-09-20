/* ============================================================
   BOT i18n — O'ZBEK TILI (uz)
   ASOSIY fayl — type shu yerdan olinadi
   ============================================================ */

/* ---------- Type (structure only) ---------- */
export type BotTranslations = {
  common: {
    yes: string;
    no: string;
    back: string;
    home: string;
    close: string;
    refresh: string;
    cancel: string;
    confirm: string;
    loading: string;
    error: string;
    notFound: string;
    noData: string;
  };
  start: {
    welcome: string;
    subtitle: string;
    openApp: string;
    getHelp: string;
    chooseLanguage: string;
    invitationReceived: string;
    bombInvitation: string;
    tttInvitation: string;
    joinPartner: string;
    joinGame: string;
  };
  help: {
    title: string;
    commands: string;
    startCmd: string;
    helpCmd: string;
    profileCmd: string;
    languageCmd: string;
    inviteCmd: string;
    referralCmd: string;
    gamesHelp: string;
  };
  subscription: {
    title: string;
    description: string;
    subscribeBtn: string;
    checkBtn: string;
    notSubscribed: string;
    subscribed: string;
    alreadySubscribed: string;
    checkFailed: string;
    channelError: string;
  };
  profile: {
    title: string;
    name: string;
    username: string;
    telegramId: string;
    language: string;
    registeredAt: string;
    lastSeen: string;
    stats: string;
    gamesPlayed: string;
    gamesWon: string;
    couplesCount: string;
    referralCount: string;
    noCouple: string;
  };
  referral: {
    title: string;
    description: string;
    yourLink: string;
    yourCode: string;
    copied: string;
    stats: string;
    howItWorks: string;
    step1: string;
    step2: string;
    step3: string;
    copyBtn: string;
    shareBtn: string;
  };
  language: {
    title: string;
    description: string;
    changed: string;
    current: string;
    uz: string;
    ru: string;
    en: string;
  };
  admin: {
    noAccess: string;
    title: string;
    description: string;
    openPanel: string;
    helpBtn: string;
    youAreAdmin: string;
    help: string;
    features: string;
  };
  broadcast: {
    title: string;
    description: string;
    enterMessage: string;
    confirm: string;
    cancel: string;
    sending: string;
    sent: string;
    failed: string;
    emptyMessage: string;
    tooLong: string;
  };
  gameInvite: {
    bombCode: string;
    tttCode: string;
    shareBtn: string;
  };
};

/* ---------- Uzbek translation ---------- */
export const uz: BotTranslations = {
  common: {
    yes: "Ha",
    no: "Yo'q",
    back: "⬅️ Orqaga",
    home: "🏠 Bosh menyu",
    close: "❌ Yopish",
    refresh: "🔄 Yangilash",
    cancel: "Bekor qilish",
    confirm: "Tasdiqlash",
    loading: "Yuklanmoqda…",
    error: "Xatolik yuz berdi",
    notFound: "Topilmadi",
    noData: "Ma'lumot yo'q",
  },
  start: {
    welcome: "❤️ <b>Couples</b>'ga xush kelibsiz!",
    subtitle: "Ikki kishi. Bir dunyo.",
    openApp: "❤️ Couples'ni ochish",
    getHelp: "ℹ️ Yordam",
    chooseLanguage: "🌐 Tilni tanlang",
    invitationReceived: "💞 Sizga Couples taklifi keldi",
    bombInvitation: "💣 Sizni Bomba o'yiniga taklif qilishdi",
    tttInvitation: "⭕❌ Sizni X-O o'yiniga taklif qilishdi",
    joinPartner: "💞 Juftingizga qo'shilish",
    joinGame: "🎮 O'yinga qo'shilish",
  },
  help: {
    title: "🛡️ <b>Couples Yordam</b>",
    commands: "<b>Buyruqlar:</b>",
    startCmd: "/start — Couples'ni ochish",
    helpCmd: "/help — Yordam",
    profileCmd: "/profile — Profil",
    languageCmd: "/language — Tilni o'zgartirish",
    inviteCmd: "/invite — Juftingizni taklif qilish",
    referralCmd: "/referral — Do'stni taklif qilish",
    gamesHelp:
      "💣 <b>Bomba:</b> <code>bomb_XXXXXX</code>\n⭕ <b>X-O:</b> <code>ttt_XXXXXX</code>",
  },
  subscription: {
    title: "📢 <b>Majburiy obuna</b>",
    description:
      "Botdan foydalanish uchun quyidagi kanallarga obuna bo'ling:",
    subscribeBtn: "➕ Obuna bo'lish",
    checkBtn: "✅ Tekshirish",
    notSubscribed: "❌ Siz hali barcha kanallarga obuna bo'lmadingiz",
    subscribed: "✅ Rahmat! Obuna tasdiqlandi",
    alreadySubscribed: "✅ Siz allaqachon obuna bo'lgansiz",
    checkFailed: "❌ Obunani tekshirib bo'lmadi. Qayta urinib ko'ring",
    channelError:
      "⚠️ Kanallarni tekshirishda xatolik. Iltimos, keyinroq urinib ko'ring",
  },
  profile: {
    title: "👤 <b>Sizning profilingiz</b>",
    name: "Ism",
    username: "Username",
    telegramId: "Telegram ID",
    language: "Til",
    registeredAt: "Ro'yxatdan o'tgan",
    lastSeen: "Oxirgi faollik",
    stats: "📊 <b>Statistika</b>",
    gamesPlayed: "O'yinlar",
    gamesWon: "G'alabalar",
    couplesCount: "Juftliklar",
    referralCount: "Taklif qilganlar",
    noCouple: "Siz hali juftlikda emassiz",
  },
  referral: {
    title: "🎁 <b>Do'stni taklif qilish</b>",
    description: "Do'stingizni taklif qiling va bonusga ega bo'ling!",
    yourLink: "Sizning havolangiz:",
    yourCode: "Sizning kodingiz:",
    copied: "✅ Nusxalandi",
    stats: "Siz taklif qilganlar: <b>{count}</b>",
    howItWorks: "<b>Qanday ishlaydi?</b>",
    step1: "1. Havolani do'stingizga yuboring",
    step2: "2. Do'stingiz botga kirsin",
    step3: "3. Siz bonusga ega bo'lasiz",
    copyBtn: "📋 Nusxalash",
    shareBtn: "📤 Ulashish",
  },
  language: {
    title: "🌐 <b>Tilni tanlang</b>",
    description: "Quyidagi tillardan birini tanlang:",
    changed: "✅ Til o'zgartirildi",
    current: "Joriy til",
    uz: "🇺🇿 O'zbekcha",
    ru: "🇷🇺 Русский",
    en: "🇬🇧 English",
  },
  admin: {
    noAccess: "⛔ Ruxsat yo'q",
    title: "🛡️ <b>Couples Admin</b>",
    description: "Admin panelni ochish uchun tugmani bosing.",
    openPanel: "📊 Admin Panelni ochish",
    helpBtn: "ℹ️ Yordam",
    youAreAdmin: "Siz adminsiz",
    help: "🛡️ <b>Admin Yordam</b>",
    features: "<b>Panel funksiyalari:</b>",
  },
  broadcast: {
    title: "📢 <b>Broadcast</b>",
    description: "Xabarni barcha foydalanuvchilarga yuborish",
    enterMessage: "Xabar matnini yuboring:",
    confirm: "✅ Yuborish",
    cancel: "❌ Bekor qilish",
    sending: "⏳ Yuborilmoqda…",
    sent: "✅ Xabar yuborildi: {sent} ta",
    failed: "❌ Xatolik: {failed} ta",
    emptyMessage: "Xabar bo'sh bo'lmasligi kerak",
    tooLong: "Xabar juda uzun (maksimal 4096 belgi)",
  },
  gameInvite: {
    bombCode: "O'yin kodi",
    tttCode: "O'yin kodi",
    shareBtn: "📤 Do'stga ulashish",
  },
};