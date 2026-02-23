import { http, HttpResponse } from "msw";
import { mockTag, mockTag2 } from "../fixtures";

export const tagsHandlers = [
  http.get("http://localhost/api/tags", () => {
    return HttpResponse.json([mockTag, mockTag2]);
  }),
];
