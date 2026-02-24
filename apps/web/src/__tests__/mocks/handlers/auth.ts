import { http, HttpResponse } from "msw";

export const authHandlers = [
  http.get("http://localhost:8787/api/auth/me", () => {
    return HttpResponse.json({ id: "user-1", email: "test@example.com" });
  }),

  http.post("http://localhost:8787/api/auth/logout", () => {
    return HttpResponse.json({ ok: true });
  }),
];
