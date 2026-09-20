/* ============================================================
   BOT i18n — ENGLISH (en)
   ============================================================ */

import type { BotTranslations } from "./uz.js";

export const en: BotTranslations = {
  common: {
    yes: "Yes",
    no: "No",
    back: "⬅️ Back",
    home: "🏠 Main menu",
    close: "❌ Close",
    refresh: "🔄 Refresh",
    cancel: "Cancel",
    confirm: "Confirm",
    loading: "Loading…",
    error: "An error occurred",
    notFound: "Not found",
    noData: "No data",
  },

  start: {
    welcome: "❤️ Welcome to <b>Couples</b>!",
    subtitle: "Two people. One world.",
    openApp: "❤️ Open Couples",
    getHelp: "ℹ️ Help",
    chooseLanguage: "🌐 Choose language",
    invitationReceived: "💞 You received a Couples invitation",
    bombInvitation: "💣 You're invited to the Bomb game",
    tttInvitation: "⭕❌ You're invited to the Tic-Tac-Toe game",
    joinPartner: "💞 Join your partner",
    joinGame: "🎮 Join the game",
  },

  help: {
    title: "🛡️ <b>Couples Help</b>",
    commands: "<b>Commands:</b>",
    startCmd: "/start — Open Couples",
    helpCmd: "/help — Help",
    profileCmd: "/profile — Profile",
    languageCmd: "/language — Change language",
    inviteCmd: "/invite — Invite partner",
    referralCmd: "/referral — Invite a friend",
    gamesHelp:
      "💣 <b>Bomb:</b> <code>bomb_XXXXXX</code>\n⭕ <b>Tic-Tac-Toe:</b> <code>ttt_XXXXXX</code>",
  },

  subscription: {
    title: "📢 <b>Required subscription</b>",
    description: "To use the bot, subscribe to the following channels:",
    subscribeBtn: "➕ Subscribe",
    checkBtn: "✅ Check",
    notSubscribed: "❌ You haven't subscribed to all channels yet",
    subscribed: "✅ Thank you! Subscription confirmed",
    alreadySubscribed: "✅ You are already subscribed",
    checkFailed: "❌ Failed to verify subscription. Please try again",
    channelError: "⚠️ Error checking channels. Please try again later",
  },

  profile: {
    title: "👤 <b>Your profile</b>",
    name: "Name",
    username: "Username",
    telegramId: "Telegram ID",
    language: "Language",
    registeredAt: "Registered",
    lastSeen: "Last seen",
    stats: "📊 <b>Statistics</b>",
    gamesPlayed: "Games",
    gamesWon: "Wins",
    couplesCount: "Couples",
    referralCount: "Referrals",
    noCouple: "You're not in a couple yet",
  },

  referral: {
    title: "🎁 <b>Invite a friend</b>",
    description: "Invite a friend and get a bonus!",
    yourLink: "Your link:",
    yourCode: "Your code:",
    copied: "✅ Copied",
    stats: "You invited: <b>{count}</b>",
    howItWorks: "<b>How it works?</b>",
    step1: "1. Send the link to a friend",
    step2: "2. Friend opens the bot",
    step3: "3. You get a bonus",
    copyBtn: "📋 Copy",
    shareBtn: "📤 Share",
  },

  language: {
    title: "🌐 <b>Choose language</b>",
    description: "Choose one of the following languages:",
    changed: "✅ Language changed",
    current: "Current language",
    uz: "🇺🇿 O'zbekcha",
    ru: "🇷🇺 Русский",
    en: "🇬🇧 English",
  },

  admin: {
    noAccess: "⛔ Access denied",
    title: "🛡️ <b>Couples Admin</b>",
    description: "Click the button to open the admin panel.",
    openPanel: "📊 Open Admin Panel",
    helpBtn: "ℹ️ Help",
    youAreAdmin: "You are an admin",
    help: "🛡️ <b>Admin Help</b>",
    features: "<b>Panel features:</b>",
  },

  broadcast: {
    title: "📢 <b>Broadcast</b>",
    description: "Send a message to all users",
    enterMessage: "Send the message text:",
    confirm: "✅ Send",
    cancel: "❌ Cancel",
    sending: "⏳ Sending…",
    sent: "✅ Sent: {sent}",
    failed: "❌ Failed: {failed}",
    emptyMessage: "Message cannot be empty",
    tooLong: "Message too long (max 4096 characters)",
  },

  gameInvite: {
    bombCode: "Game code",
    tttCode: "Game code",
    shareBtn: "📤 Share with a friend",
  },
};