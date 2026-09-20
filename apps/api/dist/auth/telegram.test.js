import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { ApiError } from "../common/errors/api-error.js";
import { validateTelegramInitData } from "./telegram.js";
const BOT_TOKEN = "123456:TEST_TOKEN";
const NOW = 1_700_000_000_000;
function makeInitData(authDate = Math.floor(NOW / 1000), mutateHash = false) {
    const params = new URLSearchParams({
        auth_date: String(authDate),
        query_id: "AAEAA",
        user: JSON.stringify({
            id: 9007199254740993n.toString(),
            first_name: "Test",
            username: "tester",
            language_code: "uz",
        }),
    });
    const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
    let hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    if (mutateHash)
        hash = `${hash.slice(0, -1)}${hash.endsWith("0") ? "1" : "0"}`;
    params.set("hash", hash);
    return params.toString();
}
test("accepts valid Telegram initData and preserves large Telegram IDs", () => {
    const identity = validateTelegramInitData(makeInitData(), BOT_TOKEN, 86400, NOW);
    assert.equal(identity.id.toString(), "9007199254740993");
    assert.equal(identity.firstName, "Test");
    assert.equal(identity.username, "tester");
});
test("rejects an invalid signature", () => {
    assert.throws(() => validateTelegramInitData(makeInitData(undefined, true), BOT_TOKEN, 86400, NOW), (error) => error instanceof ApiError && error.code === "INVALID_TELEGRAM_INIT_DATA");
});
test("rejects missing hash", () => {
    const params = new URLSearchParams(makeInitData());
    params.delete("hash");
    assert.throws(() => validateTelegramInitData(params.toString(), BOT_TOKEN, 86400, NOW), (error) => error instanceof ApiError && error.code === "INVALID_TELEGRAM_INIT_DATA");
});
test("rejects expired auth_date", () => {
    const expired = Math.floor(NOW / 1000) - 86401;
    assert.throws(() => validateTelegramInitData(makeInitData(expired), BOT_TOKEN, 86400, NOW), (error) => error instanceof ApiError && error.code === "TELEGRAM_INIT_DATA_EXPIRED");
});
test("rejects malformed Telegram user data", () => {
    const params = new URLSearchParams(makeInitData());
    params.set("user", "{not-json}");
    // The signature must also be valid for the modified payload.
    params.delete("hash");
    const dataCheckString = [...params.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
    const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
    const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
    params.set("hash", hash);
    assert.throws(() => validateTelegramInitData(params.toString(), BOT_TOKEN, 86400, NOW), (error) => error instanceof ApiError && error.code === "INVALID_TELEGRAM_INIT_DATA");
});
