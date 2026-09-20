/* ============================================================
   BOT i18n — РУССКИЙ ЯЗЫК (ru)
   ============================================================ */

import type { BotTranslations } from "./uz.js";

export const ru: BotTranslations = {
  common: {
    yes: "Да",
    no: "Нет",
    back: "⬅️ Назад",
    home: "🏠 Главное меню",
    close: "❌ Закрыть",
    refresh: "🔄 Обновить",
    cancel: "Отмена",
    confirm: "Подтвердить",
    loading: "Загрузка…",
    error: "Произошла ошибка",
    notFound: "Не найдено",
    noData: "Нет данных",
  },

  start: {
    welcome: "❤️ Добро пожаловать в <b>Couples</b>!",
    subtitle: "Два человека. Один мир.",
    openApp: "❤️ Открыть Couples",
    getHelp: "ℹ️ Помощь",
    chooseLanguage: "🌐 Выберите язык",
    invitationReceived: "💞 Вы получили приглашение от Couples",
    bombInvitation: "💣 Вас приглашают в игру «Бомба»",
    tttInvitation: "⭕❌ Вас приглашают в игру «X-O»",
    joinPartner: "💞 Присоединиться к партнёру",
    joinGame: "🎮 Присоединиться к игре",
  },

  help: {
    title: "🛡️ <b>Помощь Couples</b>",
    commands: "<b>Команды:</b>",
    startCmd: "/start — Открыть Couples",
    helpCmd: "/help — Помощь",
    profileCmd: "/profile — Профиль",
    languageCmd: "/language — Сменить язык",
    inviteCmd: "/invite — Пригласить партнёра",
    referralCmd: "/referral — Пригласить друга",
    gamesHelp:
      "💣 <b>Бомба:</b> <code>bomb_XXXXXX</code>\n⭕ <b>X-O:</b> <code>ttt_XXXXXX</code>",
  },

  subscription: {
    title: "📢 <b>Обязательная подписка</b>",
    description:
      "Для использования бота подпишитесь на следующие каналы:",
    subscribeBtn: "➕ Подписаться",
    checkBtn: "✅ Проверить",
    notSubscribed: "❌ Вы ещё не подписались на все каналы",
    subscribed: "✅ Спасибо! Подписка подтверждена",
    alreadySubscribed: "✅ Вы уже подписаны",
    checkFailed: "❌ Не удалось проверить подписку. Попробуйте ещё раз",
    channelError:
      "⚠️ Ошибка при проверке каналов. Пожалуйста, попробуйте позже",
  },

  profile: {
    title: "👤 <b>Ваш профиль</b>",
    name: "Имя",
    username: "Username",
    telegramId: "Telegram ID",
    language: "Язык",
    registeredAt: "Дата регистрации",
    lastSeen: "Последняя активность",
    stats: "📊 <b>Статистика</b>",
    gamesPlayed: "Игр",
    gamesWon: "Побед",
    couplesCount: "Пары",
    referralCount: "Приглашено",
    noCouple: "Вы ещё не в паре",
  },

  referral: {
    title: "🎁 <b>Пригласить друга</b>",
    description: "Пригласите друга и получите бонус!",
    yourLink: "Ваша ссылка:",
    yourCode: "Ваш код:",
    copied: "✅ Скопировано",
    stats: "Вы пригласили: <b>{count}</b>",
    howItWorks: "<b>Как это работает?</b>",
    step1: "1. Отправьте ссылку другу",
    step2: "2. Друг заходит в бота",
    step3: "3. Вы получаете бонус",
    copyBtn: "📋 Скопировать",
    shareBtn: "📤 Поделиться",
  },

  language: {
    title: "🌐 <b>Выберите язык</b>",
    description: "Выберите один из следующих языков:",
    changed: "✅ Язык изменён",
    current: "Текущий язык",
    uz: "🇺🇿 O'zbekcha",
    ru: "🇷🇺 Русский",
    en: "🇬🇧 English",
  },

  admin: {
    noAccess: "⛔ Доступ запрещён",
    title: "🛡️ <b>Couples Admin</b>",
    description: "Нажмите кнопку, чтобы открыть админ-панель.",
    openPanel: "📊 Открыть админ-панель",
    helpBtn: "ℹ️ Помощь",
    youAreAdmin: "Вы администратор",
    help: "🛡️ <b>Помощь администратора</b>",
    features: "<b>Функции панели:</b>",
  },

  broadcast: {
    title: "📢 <b>Рассылка</b>",
    description: "Отправить сообщение всем пользователям",
    enterMessage: "Отправьте текст сообщения:",
    confirm: "✅ Отправить",
    cancel: "❌ Отмена",
    sending: "⏳ Отправка…",
    sent: "✅ Отправлено: {sent}",
    failed: "❌ Ошибок: {failed}",
    emptyMessage: "Сообщение не может быть пустым",
    tooLong: "Сообщение слишком длинное (максимум 4096 символов)",
  },

  gameInvite: {
    bombCode: "Код игры",
    tttCode: "Код игры",
    shareBtn: "📤 Поделиться с другом",
  },
};