/* ============================================================
   BOT ADMIN — Handler
   Redirects to Web Admin Panel + quick stats
   ============================================================ */
import { InlineKeyboard } from "grammy";
import { isAdmin } from "./admin.auth.js";
const ADMIN_WEB_URL = process.env.ADMIN_WEB_URL ?? "http://localhost:5174";
export function registerAdminHandler(bot) {
    /* ============ /admin ============ */
    bot.command("admin", async (ctx) => {
        const userId = ctx.from?.id;
        if (!userId || !isAdmin(userId)) {
            await ctx.reply("⛔ Ruxsat yo'q");
            return;
        }
        const keyboard = new InlineKeyboard()
            .webApp("📊 Admin Panelni ochish", ADMIN_WEB_URL)
            .row()
            .text("📢 Broadcast", "broadcast:start")
            .text("ℹ️ Yordam", "admin:help");
        await ctx.reply([
            "🛡️ <b>Couples Admin</b>",
            "",
            "Admin panelni ochish uchun tugmani bosing.",
            "Panel Telegram WebApp orqali avtomatik autentifikatsiya qilinadi.",
            "",
            `<i>Faqat adminlar uchun: <code>${userId}</code></i>`,
        ].join("\n"), {
            reply_markup: keyboard,
            parse_mode: "HTML",
        });
    });
    /* ============ Callback: help ============ */
    bot.callbackQuery("admin:help", async (ctx) => {
        await ctx.answerCallbackQuery();
        await ctx.reply([
            "🛡️ <b>Admin Yordam</b>",
            "",
            "<b>Buyruqlar:</b>",
            "/admin — Admin panelni ochish",
            "/broadcast — Xabar yuborish (barcha userlarga)",
            "",
            "<b>Panel funksiyalari:</b>",
            "• 📊 Dashboard — real-time statistika",
            "• 👥 Users — foydalanuvchilar boshqaruvi",
            "• 🎮 Games — o'yinlar monitoringi",
            "• 📈 Statistics — vaqt bo'yicha tahlil",
            "• 📋 Logs — audit trail",
            "• ⚙️ System — tizim holati",
        ].join("\n"), { parse_mode: "HTML" });
    });
}
