import { http, HttpResponse } from "msw";
import { mockCategory } from "../fixtures";

export const categoriesHandlers = [
  http.get("http://localhost/api/categories", () => {
    return HttpResponse.json([mockCategory]);
  }),

  http.delete("http://localhost/api/categories/:id", () => {
    return HttpResponse.json({ ok: true });
  }),
];
