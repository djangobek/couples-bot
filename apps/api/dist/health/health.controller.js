import { prisma } from "../database/prisma.service.js";
import { success } from "../common/response.js";
export async function registerHealthRoutes(app) {
    app.get("/health", async () => success({ status: "ok" }));
    app.get("/health/ready", async () => {
        await prisma.$queryRaw `SELECT 1`;
        return success({ status: "ready" });
    });
}
