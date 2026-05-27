/**
 * Password gate + signed cookie session.
 *
 * Uses Web Crypto so it works in both the Node and Edge runtimes (the proxy
 * runs on Edge by default in Next 16). Cookie format:
 *
 *   "<issuedAt>.<hex(hmacSha256(issuedAt, AUTH_SECRET))>"
 *
 * Cookies survive 30 days. Verifying re-derives the HMAC and constant-time
 * compares the result.
 */

export const SESSION_COOKIE = "dochatty_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const enc = new TextEncoder();

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function passwordMatches(
  submitted: string,
  expected: string,
): Promise<boolean> {
  // HMAC both sides with a per-request salt to length-equalize.
  const salt = crypto.randomUUID();
  const [a, b] = await Promise.all([
    hmacHex(submitted, salt),
    hmacHex(expected, salt),
  ]);
  return constantTimeEqual(a, b);
}

export async function signSession(
  secret: string,
  issuedAt = Date.now(),
): Promise<string> {
  const payload = String(issuedAt);
  const sig = await hmacHex(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifySession(
  token: string | undefined,
  secret: string,
): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot < 1) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const issuedAt = Number(payload);
  if (!Number.isFinite(issuedAt)) return false;
  if (Date.now() - issuedAt > SESSION_TTL_SECONDS * 1000) return false;
  const expected = await hmacHex(payload, secret);
  return constantTimeEqual(sig, expected);
}
