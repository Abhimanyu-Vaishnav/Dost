"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "dim" | "light" | "midnight" | "system";
export type FontSize = "xs" | "sm" | "md" | "lg" | "xl";
export type FontFamily = "default" | "inter" | "roboto" | "monospace";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  setTheme: () => {},
  accentColor: "#1d9bf0",
  setAccentColor: () => {},
  fontSize: "md",
  setFontSize: () => {},
  fontFamily: "default",
  setFontFamily: () => {},
  reducedMotion: false,
  setReducedMotion: () => {}
});

function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "29, 155, 240";
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r}, ${g}, ${b}`;
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [accentColor, setAccentColorState] = useState<string>("#1d9bf0");
  const [fontSize, setFontSizeState] = useState<FontSize>("md");
  const [fontFamily, setFontFamilyState] = useState<FontFamily>("default");
  const [reducedMotion, setReducedMotionState] = useState<boolean>(false);

  const applyAccentColor = (color: string) => {
    document.documentElement.style.setProperty("--color-primary", color);
    document.documentElement.style.setProperty("--color-primary-rgb", hexToRgb(color));
  };

  const applyFontFamily = (font: FontFamily) => {
    let fontVal = 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    if (font === "inter") fontVal = '"Inter", -apple-system, BlinkMacSystemFont, sans-serif';
    if (font === "roboto") fontVal = '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif';
    if (font === "monospace") fontVal = '"Fira Code", "Courier New", monospace';
    document.documentElement.style.setProperty("--font-active-family", fontVal);
    document.body.style.fontFamily = fontVal;
  };

  const applyTheme = (targetTheme: Theme) => {
    let effectiveTheme = targetTheme;
    if (targetTheme === "system") {
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      effectiveTheme = prefersDark ? "dark" : "light";
    }
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  };

  useEffect(() => {
    const savedTheme = (localStorage.getItem("dost_theme") as Theme) || "dark";
    const savedAccent = localStorage.getItem("dost_accent_color") || "#1d9bf0";
    const savedFontSize = (localStorage.getItem("dost_font_size") as FontSize) || "md";
    const savedFontFamily = (localStorage.getItem("dost_font_family") as FontFamily) || "default";
    const savedReducedMotion = localStorage.getItem("dost_reduced_motion") === "true";

    setThemeState(savedTheme);
    setAccentColorState(savedAccent);
    setFontSizeState(savedFontSize);
    setFontFamilyState(savedFontFamily);
    setReducedMotionState(savedReducedMotion);

    applyTheme(savedTheme);
    applyAccentColor(savedAccent);
    applyFontFamily(savedFontFamily);
    document.documentElement.setAttribute("data-font-size", savedFontSize);
    document.documentElement.setAttribute("data-reduced-motion", savedReducedMotion ? "true" : "false");
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("dost_theme", newTheme);
    applyTheme(newTheme);
  };

  const setAccentColor = (newColor: string) => {
    setAccentColorState(newColor);
    localStorage.setItem("dost_accent_color", newColor);
    applyAccentColor(newColor);
  };

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    localStorage.setItem("dost_font_size", newSize);
    document.documentElement.setAttribute("data-font-size", newSize);
  };

  const setFontFamily = (newFont: FontFamily) => {
    setFontFamilyState(newFont);
    localStorage.setItem("dost_font_family", newFont);
    applyFontFamily(newFont);
  };

  const setReducedMotion = (reduced: boolean) => {
    setReducedMotionState(reduced);
    localStorage.setItem("dost_reduced_motion", reduced ? "true" : "false");
    document.documentElement.setAttribute("data-reduced-motion", reduced ? "true" : "false");
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        reducedMotion,
        setReducedMotion
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);


