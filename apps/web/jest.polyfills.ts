// Polyfill Web APIs for jest-environment-jsdom + MSW v2
// ES imports are hoisted so we use require() to control initialization order.

// 1. Text encoding — must come FIRST (undici / busboy depend on TextDecoder)
const { TextDecoder: TD, TextEncoder: TE } = require("util") as {
  TextDecoder: typeof TextDecoder;
  TextEncoder: typeof TextEncoder;
};
Object.assign(globalThis, { TextDecoder: TD, TextEncoder: TE });

// 2. Streams (needed by undici)
const { ReadableStream: RS, WritableStream: WS, TransformStream: TS } =
  require("stream/web") as {
    ReadableStream: typeof ReadableStream;
    WritableStream: typeof WritableStream;
    TransformStream: typeof TransformStream;
  };
Object.assign(globalThis, { ReadableStream: RS, WritableStream: WS, TransformStream: TS });

// 3. BroadcastChannel (needed by MSW's ws.ts)
if (!globalThis.BroadcastChannel) {
  // Node.js 18+ has BroadcastChannel; expose it to jsdom context
  const { BroadcastChannel: BC } = require("node:worker_threads") as {
    BroadcastChannel: typeof BroadcastChannel;
  };
  Object.assign(globalThis, { BroadcastChannel: BC });
}

// 4. Fetch API — undici is safe to load now that encodings/streams are set up
const {
  fetch: _fetch,
  Response: _Response,
  Request: _Request,
  Headers: _Headers,
  FormData: _FormData,
} = require("undici") as {
  fetch: typeof fetch;
  Response: typeof Response;
  Request: typeof Request;
  Headers: typeof Headers;
  FormData: typeof FormData;
};
Object.assign(globalThis, {
  fetch: _fetch,
  Response: _Response,
  Request: _Request,
  Headers: _Headers,
  FormData: _FormData,
});
