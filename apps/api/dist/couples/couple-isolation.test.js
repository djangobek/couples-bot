import assert from "node:assert/strict";
import test from "node:test";
import { ApiError } from "../common/errors/api-error.js";
import { assertCoupleOwnership } from "./couple-isolation.js";
const context = {
    userId: "user-1",
    coupleId: "couple-1",
    membershipId: "membership-1",
    role: "PARTNER",
};
test("allows a resource from the authenticated couple", () => {
    assert.doesNotThrow(() => assertCoupleOwnership("couple-1", context));
});
test("rejects a resource from another couple", () => {
    assert.throws(() => assertCoupleOwnership("couple-2", context), (error) => error instanceof ApiError && error.code === "FORBIDDEN");
});
