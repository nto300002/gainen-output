import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { createDb } from "../db";
import { sessions } from "../db/schema";
import { eq } from "drizzle-orm";
import type { Bindings } from "../types/env";
import { authMiddleware } from "../middleware/auth";

const app = new Hono<{ Bindings: Bindings }>();

// ─── Google OAuth 開始 ────────────────────────────────────────────────────────

app.get("/google", async (c) => {
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // state と code_verifier を短命 KV 的に Cookie に保存（Workers では簡易実装）
  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 600,
    path: "/",
  });
  setCookie(c, "code_verifier", codeVerifier, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 600,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: getCallbackUrl(c.req.url),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent",
  });

  return c.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    302,
  );
});

// ─── Google OAuth コールバック ─────────────────────────────────────────────────

app.get("/callback", async (c) => {
  const { code, state, error } = c.req.query();

  if (error) {
    throw new HTTPException(400, { message: `OAuth error: ${error}` });
  }

  if (!code) {
    throw new HTTPException(400, { message: "Missing code" });
  }

  const storedState = getCookieValue(c.req.raw, "oauth_state");
  const codeVerifier = getCookieValue(c.req.raw, "code_verifier");

  if (!storedState || state !== storedState || !codeVerifier) {
    throw new HTTPException(400, { message: "Invalid state" });
  }

  // トークン取得
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.env.GOOGLE_CLIENT_ID,
      client_secret: c.env.GOOGLE_CLIENT_SECRET,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: getCallbackUrl(c.req.url),
    }),
  });

  if (!tokenRes.ok) {
    throw new HTTPException(400, { message: "Failed to exchange code" });
  }

  const tokenData = (await tokenRes.json()) as { access_token: string };

  // ユーザー情報取得
  const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) {
    throw new HTTPException(400, { message: "Failed to fetch user info" });
  }

  const user = (await userRes.json()) as { email: string };

  if (user.email !== c.env.ADMIN_EMAIL) {
    throw new HTTPException(403, { message: "Not an admin" });
  }

  // セッション作成 (7日間)
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const db = createDb(c.env.DB);
  await db.insert(sessions).values({
    id: sessionId,
    user_email: user.email,
    expires_at: expiresAt,
  });

  setCookie(c, "session_id", sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    expires: new Date(expiresAt),
    path: "/",
  });

  return c.redirect(`${c.env.FRONTEND_URL}/admin`, 302);
});

// ─── ログアウト ───────────────────────────────────────────────────────────────

app.post("/logout", authMiddleware(), async (c) => {
  const sessionId = getCookieValue(c.req.raw, "session_id");
  if (sessionId) {
    const db = createDb(c.env.DB);
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  deleteCookie(c, "session_id", { path: "/" });
  return c.json({ ok: true });
});

// ─── 認証確認 ─────────────────────────────────────────────────────────────────

app.get("/me", authMiddleware(), (c) => {
  return c.json({ email: c.get("userEmail") });
});

// ─── Helper functions ─────────────────────────────────────────────────────────

function getCallbackUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.protocol}//${url.host}/api/auth/callback`;
}

function getCookieValue(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [k, ...v] = c.split("=");
      return [k ?? "", v.join("=")];
    }),
  );
  return cookies[name];
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export { app as authRouter };
