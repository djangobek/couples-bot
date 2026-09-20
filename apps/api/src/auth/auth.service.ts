import { prisma } from "../database/prisma.service.js";
import type { TelegramIdentity } from "./telegram.js";
import type { AuthenticatedUser } from "./auth.types.js";
import { ApiError } from "../common/errors/api-error.js";

export class AuthService {
  async resolveUser(identity: TelegramIdentity): Promise<AuthenticatedUser> {
    const user = await prisma.user.upsert({
      where: { telegramId: identity.id },
      update: {
        username: identity.username,
        firstName: identity.firstName,
        lastName: identity.lastName,
        languageCode: identity.languageCode,
        photoUrl: identity.photoUrl,
        lastSeenAt: new Date(),
      },
      create: {
        telegramId: identity.id,
        username: identity.username,
        firstName: identity.firstName,
        lastName: identity.lastName,
        languageCode: identity.languageCode,
        photoUrl: identity.photoUrl,
        lastSeenAt: new Date(),
      },
      select: { id: true, telegramId: true, status: true },
    });

    if (user.status === "BLOCKED" || user.status === "DELETED") {
      throw new ApiError("FORBIDDEN", "This Telegram account cannot access Couples", 403);
    }

    return user;
  }
}

export const authService = new AuthService();
