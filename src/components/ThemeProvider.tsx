"use client";

import { useEffect } from "react";
import { applyDarkTheme } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyDarkTheme();
  }, []);

  return children;
}
