// API_URL is baked into the bundle at build time via Vite (VITE_API_URL env var).
// In Jest tests, mock this module: jest.mock("../config", () => ({ API_URL: "..." }))
export const API_URL: string =
  (typeof process !== "undefined" && process.env.VITE_API_URL) ||
  "http://localhost:8787";
