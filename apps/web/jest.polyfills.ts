// Polyfill Web Fetch API for jest-environment-jsdom + MSW v2
// Node.js 18+ includes these via undici, but jsdom's vm context doesn't inherit them.
import { fetch, Response, Request, Headers, FormData } from "undici";

Object.assign(globalThis, {
  fetch,
  Response,
  Request,
  Headers,
  FormData,
});
