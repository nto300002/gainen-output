import { cors } from "hono/cors";
import type { Bindings } from "../types/env";
import type { MiddlewareHandler } from "hono";

export function corsMiddleware(): MiddlewareHandler<{ Bindings: Bindings }> {
  return async (c, next) => {
    const frontendUrl = c.env.FRONTEND_URL;
    return cors({
      origin: [frontendUrl, "http://localhost:3001", "http://localhost:3000"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })(c, next);
  };
}
