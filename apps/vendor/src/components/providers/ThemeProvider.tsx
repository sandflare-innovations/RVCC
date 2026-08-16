"use client";

import * as React from "react";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  React.useEffect(() => {
    // Suppress next-themes script tag warning in React 19/Next 16
    if (process.env.NODE_ENV === "development") {
      const orig = console.error;
      console.error = (...args: unknown[]) => {
        if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
          return;
        }
        orig.apply(console, args);
      };

      return () => {
        console.error = orig;
      };
    }
  }, []);

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
