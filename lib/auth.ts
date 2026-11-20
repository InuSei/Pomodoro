import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "rmt_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days, in seconds

function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be set to 32+ characters");
  return new TextEncoder().encode(secret);
}

export function createSession() {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined) {
  if (!token) return false;
  const key = secretKey(); // outside try: a missing secret should crash loudly, not look like "logged out"
  try {
    await jwtVerify(token, key, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}
