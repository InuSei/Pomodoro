"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSession } from "@/lib/auth";

const sha256 = (s: string) => createHash("sha256").update(s).digest();

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const expected = process.env.APP_ACCESS_PIN;
  if (!expected) throw new Error("APP_ACCESS_PIN is not set");

  const pin = String(formData.get("pin") ?? "");
  // Hash first so lengths match; timingSafeEqual avoids leaking how many characters were right.
  if (!timingSafeEqual(sha256(pin), sha256(expected))) {
    // shortcut: a fixed delay slows guessing per request but is not a real rate limit; add a Mongo-backed attempt counter if the PIN is short.
    await new Promise((r) => setTimeout(r, 1000));
    return "That passphrase didn't match. Try again?";
  }

  (await cookies()).set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect("/");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
