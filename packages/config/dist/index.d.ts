export declare const env: {
    readonly ADMIN_TELEGRAM_IDS: Set<string>;
    readonly isProduction: boolean;
    readonly DATABASE_URL: string;
    readonly BOT_TOKEN: string;
    readonly BOT_USERNAME: string;
    readonly WEB_APP_URL: string;
    readonly API_PORT: number;
    readonly API_URL: string;
    readonly TELEGRAM_WEBHOOK_SECRET: string;
    readonly TELEGRAM_INIT_DATA_MAX_AGE_SECONDS: number;
    readonly REQUIRED_CHANNELS: string;
    readonly SUBSCRIPTION_CACHE_TTL_SECONDS: number;
    readonly DEFAULT_LANGUAGE: "uz" | "ru" | "en";
    readonly BROADCAST_BATCH_SIZE: number;
    readonly BROADCAST_BATCH_DELAY_MS: number;
    readonly NODE_ENV: "development" | "test" | "production";
};
