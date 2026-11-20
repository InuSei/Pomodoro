// Self-check for session signing: run with `npm run check:auth`.
import assert from "node:assert/strict";

process.env.JWT_SECRET = "x".repeat(32);
const { createSession, verifySession } = await import("../lib/auth.ts");

const token = await createSession();
assert.equal(await verifySession(token), true, "fresh token verifies");
assert.equal(await verifySession(undefined), false, "no cookie is rejected");
assert.equal(await verifySession(token.slice(0, -2) + "xx"), false, "tampered signature is rejected");

process.env.JWT_SECRET = "y".repeat(32);
assert.equal(await verifySession(token), false, "token from another secret is rejected");

process.env.JWT_SECRET = "short";
await assert.rejects(() => verifySession(token), /JWT_SECRET/, "weak secret fails loudly");

console.log("auth checks passed");
