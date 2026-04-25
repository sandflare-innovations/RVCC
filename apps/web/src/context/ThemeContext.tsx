"use client";

import { useTheme as useNextTheme } from "next-themes";

export const useTheme = () => {
  const { theme, resolvedTheme, setTheme } = useNextTheme();
  return { theme: resolvedTheme || theme, setTheme };
};
