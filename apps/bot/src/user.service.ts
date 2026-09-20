import { db } from "@couples/database";

export async function upsertTelegramUser(from: {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  language_code?: string;
}) {
  return db.user.upsert({
    where: { telegramId: BigInt(from.id) },
    update: {
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      languageCode: from.language_code,
      lastSeenAt: new Date(),
    },
    create: {
      telegramId: BigInt(from.id),
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
      languageCode: from.language_code,
      lastSeenAt: new Date(),
    },
    select: { id: true },
  });
}