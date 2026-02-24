import { http, HttpResponse } from "msw";

// session="has-result" のときのみ image_key を返す
export const canvaExportHandlers = [
  http.post("http://localhost/api/canva-export", async ({ request }) => {
    const formData = await request.formData();
    const sessionToken = formData.get("session_token") as string;
    const imageKey = `images/canva/${sessionToken}.png`;
    return HttpResponse.json({ ok: true, image_key: imageKey }, { status: 201 });
  }),

  http.get("http://localhost/api/canva-export/poll", ({ request }) => {
    const url = new URL(request.url);
    const session = url.searchParams.get("session");
    if (session === "has-result") {
      return HttpResponse.json({ image_key: "images/canva/export.png" });
    }
    return HttpResponse.json({ pending: true });
  }),
];
