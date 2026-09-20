import { z } from "zod";
export declare const telegramInitDataSchema: z.ZodObject<{
    initData: z.ZodString;
}, "strip", z.ZodTypeAny, {
    initData: string;
}, {
    initData: string;
}>;
export declare const paginationSchema: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    cursor?: string | undefined;
}, {
    cursor?: string | undefined;
    limit?: number | undefined;
}>;
export declare const inviteCodeSchema: z.ZodObject<{
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
}, {
    code: string;
}>;
export declare const memoryTypeSchema: z.ZodEnum<["PHOTO", "VIDEO", "AUDIO", "DOCUMENT", "TEXT"]>;
export declare const memoryVisibilitySchema: z.ZodEnum<["COUPLE", "PRIVATE"]>;
export declare const createMemorySchema: z.ZodObject<{
    type: z.ZodEnum<["PHOTO", "VIDEO", "AUDIO", "DOCUMENT", "TEXT"]>;
    title: z.ZodOptional<z.ZodString>;
    caption: z.ZodOptional<z.ZodString>;
    eventAt: z.ZodOptional<z.ZodDate>;
    locationName: z.ZodOptional<z.ZodString>;
    visibility: z.ZodDefault<z.ZodEnum<["COUPLE", "PRIVATE"]>>;
}, "strip", z.ZodTypeAny, {
    type: "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT" | "TEXT";
    visibility: "COUPLE" | "PRIVATE";
    title?: string | undefined;
    caption?: string | undefined;
    eventAt?: Date | undefined;
    locationName?: string | undefined;
}, {
    type: "PHOTO" | "VIDEO" | "AUDIO" | "DOCUMENT" | "TEXT";
    title?: string | undefined;
    caption?: string | undefined;
    eventAt?: Date | undefined;
    locationName?: string | undefined;
    visibility?: "COUPLE" | "PRIVATE" | undefined;
}>;
export declare const updateMemorySchema: z.ZodObject<{
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    caption: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    eventAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    locationName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    visibility: z.ZodOptional<z.ZodEnum<["COUPLE", "PRIVATE"]>>;
}, "strip", z.ZodTypeAny, {
    title?: string | null | undefined;
    caption?: string | null | undefined;
    eventAt?: Date | null | undefined;
    locationName?: string | null | undefined;
    visibility?: "COUPLE" | "PRIVATE" | undefined;
}, {
    title?: string | null | undefined;
    caption?: string | null | undefined;
    eventAt?: Date | null | undefined;
    locationName?: string | null | undefined;
    visibility?: "COUPLE" | "PRIVATE" | undefined;
}>;
export declare const memoryIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const reactionSchema: z.ZodObject<{
    emoji: z.ZodString;
}, "strip", z.ZodTypeAny, {
    emoji: string;
}, {
    emoji: string;
}>;
export declare const letterStatusSchema: z.ZodEnum<["DRAFT", "SENT", "READ", "ARCHIVED"]>;
export declare const createLetterSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    sendNow: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    body: string;
    sendNow: boolean;
    title?: string | undefined;
    scheduledAt?: Date | null | undefined;
}, {
    body: string;
    title?: string | undefined;
    scheduledAt?: Date | null | undefined;
    sendNow?: boolean | undefined;
}>;
export declare const updateLetterSchema: z.ZodObject<{
    title: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    body: z.ZodOptional<z.ZodString>;
    scheduledAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
}, "strip", z.ZodTypeAny, {
    title?: string | null | undefined;
    body?: string | undefined;
    scheduledAt?: Date | null | undefined;
}, {
    title?: string | null | undefined;
    body?: string | undefined;
    scheduledAt?: Date | null | undefined;
}>;
export declare const letterIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const createDateSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    startsAt: z.ZodDate;
    endsAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    location: z.ZodOptional<z.ZodString>;
    reminderAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    startsAt: Date;
    description?: string | undefined;
    endsAt?: Date | null | undefined;
    location?: string | undefined;
    reminderAt?: Date | null | undefined;
}, {
    title: string;
    startsAt: Date;
    description?: string | undefined;
    endsAt?: Date | null | undefined;
    location?: string | undefined;
    reminderAt?: Date | null | undefined;
}>;
export declare const updateDateSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startsAt: z.ZodOptional<z.ZodDate>;
    endsAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    reminderAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
}, "strip", z.ZodTypeAny, {
    title?: string | undefined;
    description?: string | null | undefined;
    startsAt?: Date | undefined;
    endsAt?: Date | null | undefined;
    location?: string | null | undefined;
    reminderAt?: Date | null | undefined;
}, {
    title?: string | undefined;
    description?: string | null | undefined;
    startsAt?: Date | undefined;
    endsAt?: Date | null | undefined;
    location?: string | null | undefined;
    reminderAt?: Date | null | undefined;
}>;
export declare const dateIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const createBookSchema: z.ZodObject<{
    title: z.ZodString;
    author: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    pageCount: z.ZodOptional<z.ZodNumber>;
    externalUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    description?: string | undefined;
    author?: string | undefined;
    pageCount?: number | undefined;
    externalUrl?: string | undefined;
}, {
    title: string;
    description?: string | undefined;
    author?: string | undefined;
    pageCount?: number | undefined;
    externalUrl?: string | undefined;
}>;
export declare const updateBookSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    author: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    pageCount: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "COMPLETED", "ARCHIVED"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "ARCHIVED" | "ACTIVE" | "COMPLETED" | undefined;
    title?: string | undefined;
    description?: string | null | undefined;
    author?: string | null | undefined;
    pageCount?: number | null | undefined;
}, {
    status?: "ARCHIVED" | "ACTIVE" | "COMPLETED" | undefined;
    title?: string | undefined;
    description?: string | null | undefined;
    author?: string | null | undefined;
    pageCount?: number | null | undefined;
}>;
export declare const bookIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const updateReadingProgressSchema: z.ZodObject<{
    bookId: z.ZodString;
    currentPage: z.ZodNumber;
    pagesRead: z.ZodNumber;
    totalReadSeconds: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    bookId: string;
    currentPage: number;
    pagesRead: number;
    totalReadSeconds?: number | undefined;
}, {
    bookId: string;
    currentPage: number;
    pagesRead: number;
    totalReadSeconds?: number | undefined;
}>;
export declare const challengeTypeSchema: z.ZodEnum<["READING_RACE", "STREAK", "PAGES", "CUSTOM"]>;
export declare const createChallengeSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodDefault<z.ZodEnum<["READING_RACE", "STREAK", "PAGES", "CUSTOM"]>>;
    bookId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    targetValue: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    startsAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    endsAt: z.ZodNullable<z.ZodOptional<z.ZodDate>>;
    rules: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    type: "READING_RACE" | "STREAK" | "PAGES" | "CUSTOM";
    title: string;
    description?: string | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    bookId?: string | null | undefined;
    targetValue?: number | null | undefined;
    rules?: Record<string, unknown> | undefined;
}, {
    title: string;
    type?: "READING_RACE" | "STREAK" | "PAGES" | "CUSTOM" | undefined;
    description?: string | undefined;
    startsAt?: Date | null | undefined;
    endsAt?: Date | null | undefined;
    bookId?: string | null | undefined;
    targetValue?: number | null | undefined;
    rules?: Record<string, unknown> | undefined;
}>;
export declare const challengeIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const challengeProgressSchema: z.ZodObject<{
    score: z.ZodOptional<z.ZodNumber>;
    progress: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    score?: number | undefined;
    progress?: number | undefined;
}, {
    score?: number | undefined;
    progress?: number | undefined;
}>;
export type TelegramInitDataInput = z.infer<typeof telegramInitDataSchema>;
export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
export type CreateLetterInput = z.infer<typeof createLetterSchema>;
export type UpdateLetterInput = z.infer<typeof updateLetterSchema>;
export type CreateDateInput = z.infer<typeof createDateSchema>;
export type UpdateDateInput = z.infer<typeof updateDateSchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type UpdateReadingProgressInput = z.infer<typeof updateReadingProgressSchema>;
export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
export type ChallengeProgressInput = z.infer<typeof challengeProgressSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
