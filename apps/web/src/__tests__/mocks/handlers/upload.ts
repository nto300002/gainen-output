import { http, HttpResponse } from "msw";

export const uploadHandlers = [
  http.post("http://localhost:3000/api/upload", () => {
    return HttpResponse.json({
      key: "images/uploaded-image.png",
      url: "https://cdn.example.com/images/uploaded-image.png",
    });
  }),
];
