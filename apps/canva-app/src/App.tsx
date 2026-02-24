import { useState } from "react";
import { canvaSDK } from "./canva-sdk";

type Status = "idle" | "loading" | "done" | "error";

export default function App() {
  const params = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const sessionToken = params.get("session") ?? "";
  const apiUrl = params.get("api") ?? "";

  const [status, setStatus] = useState<Status>("idle");

  async function handleExport() {
    setStatus("loading");
    try {
      const result = await canvaSDK.exportContent({ acceptedFileTypes: ["PNG"] });
      const blobUrl = result.exportBlobs[0].url;

      const blobRes = await fetch(blobUrl);
      const blob = await blobRes.blob();

      const formData = new FormData();
      formData.append("session_token", sessionToken);
      formData.append("file", blob, "export.png");

      const apiRes = await fetch(`${apiUrl}/api/canva-export`, {
        method: "POST",
        body: formData,
      });

      if (!apiRes.ok) throw new Error("API error");

      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <button onClick={handleExport} disabled={status === "loading"}>
        {status === "loading" ? "エクスポート中..." : "概念ノートへエクスポート"}
      </button>
      {status === "done" && <p>エクスポート完了</p>}
      {status === "error" && <p>エクスポートに失敗しました</p>}
    </div>
  );
}
