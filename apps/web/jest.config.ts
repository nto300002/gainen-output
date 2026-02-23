import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const userConfig: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  testEnvironmentOptions: {
    customExportConditions: [""],
  },
  setupFiles: ["<rootDir>/jest.polyfills.ts"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^next/image$": "<rootDir>/src/__tests__/mocks/next-image.tsx",
    "^next/navigation$": "<rootDir>/src/__tests__/mocks/next-navigation.ts",
    "^react-markdown$": "<rootDir>/src/__tests__/mocks/react-markdown.tsx",
    "^next-themes$": "<rootDir>/src/__tests__/mocks/next-themes.ts",
  },
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
  ],
};

// Next.js's default transformIgnorePatterns only exempts "geist" in the pnpm
// virtual store, which causes MSW's ESM deps (until-async, etc.) to fail.
// We post-process the config to extend the exemption list.
const ESM_PACKAGES = [
  "geist",
  "msw",
  "@mswjs",
  "until-async",
  "path-to-regexp",
  "strict-event-emitter",
];

async function getJestConfig(): Promise<Config> {
  const config = await (createJestConfig(userConfig) as () => Promise<Config>)();
  config.transformIgnorePatterns = [
    // pnpm virtual store: exempt ESM packages from exclusion
    `/node_modules/.pnpm/(?!(${ESM_PACKAGES.map((p) => p.replace("/", "\\+") + "@").join("|")}))`,
    // regular node_modules: exempt .pnpm dir and ESM packages
    `/node_modules/(?!(\\.pnpm|${ESM_PACKAGES.join("|")})/)`,
    // CSS modules (Next.js default)
    "^.+\\.module\\.(css|sass|scss)$",
  ];
  return config;
}

export default getJestConfig;
