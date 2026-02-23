import "@testing-library/jest-dom";
import { server } from "@/__tests__/mocks/server";

// jsdom does not implement URL.createObjectURL / revokeObjectURL
global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/test-blob");
global.URL.revokeObjectURL = jest.fn();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
