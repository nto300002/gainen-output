export const useTheme = jest.fn(() => ({
  theme: "light",
  setTheme: jest.fn(),
  resolvedTheme: "light",
  themes: ["light", "dark"],
  systemTheme: "light" as const,
  forcedTheme: undefined,
}));

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => children;
