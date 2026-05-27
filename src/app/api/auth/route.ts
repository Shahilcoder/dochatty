import { cookies } from "next/headers";
import { env } from "@/lib/env";
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  passwordMatches,
  signSession,
} from "@/lib/auth";

// Tiny in-memory rate limit: max 10 attempts per minute per IP.
// Lives in module scope — survives between requests on the same warm Node
// instance, resets when the function is cold.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60_000;

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimitExceeded(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  b.count += 1;
  return b.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (rateLimitExceeded(ip)) {
    return Response.json(
      { error: "Too many attempts. Wait a minute." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const password =
    body && typeof body === "object" && "password" in body
      ? String((body as { password: unknown }).password ?? "")
      : "";

  if (!password) {
    return Response.json({ error: "Password is required" }, { status: 400 });
  }

  const ok = await passwordMatches(password, env.APP_PASSWORD);
  if (!ok) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = await signSession(env.AUTH_SECRET);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });

  return Response.json({ ok: true });
}

export async function DELETE() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
