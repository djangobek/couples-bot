import { Bot } from "grammy";
import { env } from "@couples/config";
import { registerAdminHandler } from "./admin/admin.handler";
import { registerWelcomeHandler } from "./welcome/welcome.handler";
import { registerSubscriptionHandler } from "./subscription/subscription.handler";
import { registerLanguageHandler } from "./language/language.handler";
import { registerProfileHandler } from "./profile/profile.handler";
import { registerReferralHandler } from "./referral/referral.handler";
import { registerBroadcastHandler } from "./broadcast/broadcast.handler";
const bot = new Bot(env.BOT_TOKEN);
/* ============================================================
   Register handlers
   ============================================================ */
registerWelcomeHandler(bot);
registerSubscriptionHandler(bot);
registerLanguageHandler(bot);
registerProfileHandler(bot);
registerReferralHandler(bot);
registerBroadcastHandler(bot);
registerAdminHandler(bot);
/* ============================================================
   Error handler
   ============================================================ */
bot.catch((error) => {
    console.error("[bot] unhandled error:", error.error);
});
/* ============================================================
   Startup
   ============================================================ */
async function start() {
    const me = await bot.api.getMe();
    console.info(`Couples bot started as @${me.username ?? me.id}`);
    await bot.api.setMyCommands([
        { command: "start", description: "Couples — ochish / open" },
        { command: "help", description: "Yordam / Помощь / Help" },
        { command: "profile", description: "Profil / Профиль / Profile" },
        { command: "language", description: "Til / Язык / Language" },
        { command: "referral", description: "Do'stni taklif qilish" },
        { command: "admin", description: "Admin panel (admin only)" },
    ]);
    await bot.api.setChatMenuButton({
        menu_button: {
            type: "web_app",
            text: "❤️ Couples",
            web_app: { url: env.WEB_APP_URL },
        },
    });
    await bot.start({
        onStart: () => console.info("Long polling is running"),
    });
}
void start().catch((error) => {
    console.error("Failed to start Couples bot:", error);
    process.exit(1);
});
