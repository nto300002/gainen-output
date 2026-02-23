import { http, HttpResponse } from "msw";
import { mockCategory } from "../fixtures";

export const categoriesHandlers = [
  http.get("http://localhost:3000/api/categories", () => {
    return HttpResponse.json([mockCategory]);
  }),
];
