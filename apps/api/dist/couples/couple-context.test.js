import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../common/errors/api-error.js";
import { toCoupleContext } from "./couple-context.service.js";
test("resolves an active couple membership", () => {
    const result = toCoupleContext("user-1", {
        id: "membership-1",
        role: "OWNER",
        couple: { id: "couple-1", status: "ACTIVE" },
    });
    assert.deepEqual(result, {
        userId: "user-1",
        coupleId: "couple-1",
        membershipId: "membership-1",
        role: "OWNER",
    });
});
test("rejects a missing membership", () => {
    assert.throws(() => toCoupleContext("user-1", null), (error) => error instanceof ApiError && error.code === "COUPLE_MEMBERSHIP_REQUIRED");
});
test("rejects an archived couple", () => {
    assert.throws(() => toCoupleContext("user-1", {
        id: "membership-1",
        role: "PARTNER",
        couple: { id: "couple-1", status: "ARCHIVED" },
    }), (error) => error instanceof ApiError && error.code === "COUPLE_MEMBERSHIP_REQUIRED");
});
