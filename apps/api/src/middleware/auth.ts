import type { Context, MiddlewareHandler, Next } from "hono";
import { getCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";
import { createDb } from "../db";
import { sessions } from "../db/schema";
import { eq, gt } from "drizzle-orm";
import type { Bindings } from "../types/env";

type AuthVariables = {
  userEmail: string;
};

export type AuthEnv = {
  Bindings: Bindings;
  Variables: AuthVariables;
};

export function authMiddleware(): MiddlewareHandler<AuthEnv> {
  return async (c: Context<AuthEnv>, next: Next) => {
    const sessionId = getCookie(c, "session_id");
    if (!sessionId) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const db = createDb(c.env.DB);
    const now = new Date().toISOString();

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .get();

    if (!session || session.expires_at < now) {
      throw new HTTPException(401, { message: "Session expired" });
    }

    if (session.user_email !== c.env.ADMIN_EMAIL) {
      throw new HTTPException(403, { message: "Forbidden" });
    }

    c.set("userEmail", session.user_email);
    await next();
  };
}
