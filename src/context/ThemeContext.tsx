"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "dim" | "light" | "midnight";
export type FontSize = "xs" | "sm" | "md" | "lg" | "xl";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  fontSize: "md",
  setFontSize: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [fontSize, setFontSizeState] = useState<FontSize>("md");

  useEffect(() => {
    const savedTheme = (localStorage.getItem("dost_theme") as Theme) || "dark";
    const savedFontSize = (localStorage.getItem("dost_font_size") as FontSize) || "md";
    setThemeState(savedTheme);
    setFontSizeState(savedFontSize);
    document.documentElement.setAttribute("data-theme", savedTheme);
    document.documentElement.setAttribute("data-font-size", savedFontSize);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("dost_theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    localStorage.setItem("dost_font_size", newSize);
    document.documentElement.setAttribute("data-font-size", newSize);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

