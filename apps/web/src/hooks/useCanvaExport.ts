"use client";

import { useState, useEffect, useRef } from "react";
import { pollCanvaExport } from "@/lib/api";

type Options = {
  onExport: (imageKey: string) => void;
  pollIntervalMs?: number;
};

export function useCanvaExport({ onExport, pollIntervalMs = 3000 }: Options) {
  // Initialize with "" so SSR and first client render produce identical HTML.
  // The actual UUID is set in useEffect, which only runs on the client.
  // This prevents React hydration mismatches caused by different UUIDs on
  // server vs. client when using useState(() => crypto.randomUUID()).
  const [sessionToken, setSessionToken] = useState<string>("");
  const onExportRef = useRef(onExport);
  onExportRef.current = onExport;

  useEffect(() => {
    setSessionToken(crypto.randomUUID());
  }, []);

  useEffect(() => {
    // Don't poll until the token has been generated on the client.
    if (!sessionToken) return;

    let stopped = false;

    async function poll() {
      if (stopped) return;
      try {
        const result = await pollCanvaExport(sessionToken);
        if (!stopped && result.image_key) {
          stopped = true;
          onExportRef.current(result.image_key);
          return;
        }
      } catch {
        // ネットワークエラーは無視して継続
      }
      if (!stopped) {
        setTimeout(poll, pollIntervalMs);
      }
    }

    const timer = setTimeout(poll, pollIntervalMs);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [sessionToken, pollIntervalMs]);

  return { sessionToken };
}
