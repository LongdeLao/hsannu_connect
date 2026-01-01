"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useTheme } from "next-themes";

function DarkClassSync() {
  const { theme, systemTheme } = useTheme();

  React.useEffect(() => {
    const classList = document.documentElement.classList;

    const effectiveTheme = theme === "system" ? systemTheme : theme;
    const shouldHaveDark = effectiveTheme === "dark" || effectiveTheme === "deep-sea";

    if (shouldHaveDark) {
      classList.add("dark");
    } else {
      classList.remove("dark");
    }
  }, [theme, systemTheme]);

  return null;
}

function FontClassSync() {
  React.useEffect(() => {
    const classList = document.documentElement.classList;

    const apply = (val: string | null) => {
      classList.remove("font-sans-sfpro", "font-sans-rounded", "font-sans-typewriter");
      classList.add(val === "typewriter" ? "font-sans-typewriter" : "font-sans-sfpro");
    };

    try {
      const stored = typeof window !== "undefined" ? localStorage.getItem("ui-font") : null;
      apply(stored);
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === "ui-font") {
        apply(e.newValue);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme={false}
      value={{
        light: "light",
        dark: "dark",
        "deep-sea": "deep-sea",
        "warm-tomes": "warm-tomes",
        "sage-garden": "sage-garden",
        "rose-garden": "rose-garden",
      }}
    >
      <DarkClassSync />
      <FontClassSync />
      {children}
    </NextThemesProvider>
  );
} 