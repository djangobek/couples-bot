import { env } from "@couples/config";
import { buildApp } from "./app.js";
async function start() {
    const app = buildApp();
    try {
        await app.listen({
            port: env.API_PORT,
            host: "0.0.0.0",
        });
        app.log.info({ port: env.API_PORT }, "Couples API listening");
    }
    catch (error) {
        app.log.error(error, "Failed to start Couples API");
        process.exit(1);
    }
}
void start();
