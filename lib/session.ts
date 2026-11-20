import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "./auth";

// Server actions are public POST endpoints, so each one re-checks the cookie instead of trusting proxy.ts alone.
export async function requireSession() {
  if (!(await verifySession((await cookies()).get(SESSION_COOKIE)?.value))) throw new Error("Unauthorized");
}
