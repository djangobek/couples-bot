/* ============================================================
   COUPLES SHARED SCHEMAS
   Zod validation for all API routes
   ============================================================ */
import { z } from "zod";
/* ---------- Auth ---------- */
export const telegramInitDataSchema = z.object({
    initData: z.string().min(1),
});
/* ---------- Common ---------- */
export const paginationSchema = z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const inviteCodeSchema = z.object({
    code: z
        .string()
        .regex(/^[A-Za-z0-9_-]{32,128}$/, "Invalid invite code"),
});
/* ---------- Memories ---------- */
export const memoryTypeSchema = z.enum([
    "PHOTO",
    "VIDEO",
    "AUDIO",
    "DOCUMENT",
    "TEXT",
]);
export const memoryVisibilitySchema = z.enum(["COUPLE", "PRIVATE"]);
export const createMemorySchema = z.object({
    type: memoryTypeSchema,
    title: z.string().max(160).optional(),
    caption: z.string().max(4000).optional(),
    eventAt: z.coerce.date().optional(),
    locationName: z.string().max(255).optional(),
    visibility: memoryVisibilitySchema.default("COUPLE"),
});
export const updateMemorySchema = z.object({
    title: z.string().max(160).optional().nullable(),
    caption: z.string().max(4000).optional().nullable(),
    eventAt: z.coerce.date().optional().nullable(),
    locationName: z.string().max(255).optional().nullable(),
    visibility: memoryVisibilitySchema.optional(),
});
export const memoryIdSchema = z.object({
    id: z.string().uuid(),
});
export const reactionSchema = z.object({
    emoji: z.string().min(1).max(8),
});
/* ---------- Letters ---------- */
export const letterStatusSchema = z.enum([
    "DRAFT",
    "SENT",
    "READ",
    "ARCHIVED",
]);
export const createLetterSchema = z.object({
    title: z.string().max(160).optional(),
    body: z.string().min(1).max(20_000),
    scheduledAt: z.coerce.date().optional().nullable(),
    sendNow: z.boolean().default(true),
});
export const updateLetterSchema = z.object({
    title: z.string().max(160).optional().nullable(),
    body: z.string().min(1).max(20_000).optional(),
    scheduledAt: z.coerce.date().optional().nullable(),
});
export const letterIdSchema = z.object({
    id: z.string().uuid(),
});
/* ---------- Dates ---------- */
export const createDateSchema = z.object({
    title: z.string().min(1).max(160),
    description: z.string().max(2000).optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date().optional().nullable(),
    location: z.string().max(255).optional(),
    reminderAt: z.coerce.date().optional().nullable(),
});
export const updateDateSchema = z.object({
    title: z.string().min(1).max(160).optional(),
    description: z.string().max(2000).optional().nullable(),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().optional().nullable(),
    location: z.string().max(255).optional().nullable(),
    reminderAt: z.coerce.date().optional().nullable(),
});
export const dateIdSchema = z.object({
    id: z.string().uuid(),
});
/* ---------- Reading ---------- */
export const createBookSchema = z.object({
    title: z.string().min(1).max(200),
    author: z.string().max(160).optional(),
    description: z.string().max(2000).optional(),
    pageCount: z.number().int().min(1).max(20_000).optional(),
    externalUrl: z.string().url().optional(),
});
export const updateBookSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    author: z.string().max(160).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    pageCount: z.number().int().min(1).max(20_000).optional().nullable(),
    status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).optional(),
});
export const bookIdSchema = z.object({
    id: z.string().uuid(),
});
export const updateReadingProgressSchema = z.object({
    bookId: z.string().uuid(),
    currentPage: z.number().int().min(0),
    pagesRead: z.number().int().min(0),
    totalReadSeconds: z.number().int().min(0).optional(),
});
/* ---------- Challenges ---------- */
export const challengeTypeSchema = z.enum([
    "READING_RACE",
    "STREAK",
    "PAGES",
    "CUSTOM",
]);
export const createChallengeSchema = z.object({
    title: z.string().min(1).max(160),
    description: z.string().max(2000).optional(),
    type: challengeTypeSchema.default("CUSTOM"),
    bookId: z.string().uuid().optional().nullable(),
    targetValue: z.number().int().min(1).max(1_000_000).optional().nullable(),
    startsAt: z.coerce.date().optional().nullable(),
    endsAt: z.coerce.date().optional().nullable(),
    rules: z.record(z.unknown()).optional(),
});
export const challengeIdSchema = z.object({
    id: z.string().uuid(),
});
export const challengeProgressSchema = z.object({
    score: z.number().int().min(0).optional(),
    progress: z.number().min(0).max(1_000_000).optional(),
});
