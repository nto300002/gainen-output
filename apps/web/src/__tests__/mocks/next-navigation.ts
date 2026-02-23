/* eslint-disable @typescript-eslint/no-require-imports */

export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
}));

export const usePathname = jest.fn(() => "/");

export const useSearchParams = jest.fn(() => new URLSearchParams());

export const redirect = jest.fn((url: string) => {
  throw new Error(`NEXT_REDIRECT:${url}`);
});
