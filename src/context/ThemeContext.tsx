"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "dim" | "light" | "midnight" | "system";
export type FontSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
export type FontFamily = "default" | "inter" | "roboto" | "outfit" | "serif" | "monospace" | "cursive" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  setFontFromDob: (dobInput: Date | string | null | undefined) => void;
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
  setFontFromDob: () => {},
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
    if (font === "outfit") fontVal = '"Outfit", "Trebuchet MS", sans-serif';
    if (font === "serif") fontVal = '"Georgia", "Playfair Display", "Times New Roman", serif';
    if (font === "monospace") fontVal = '"Fira Code", "Courier New", monospace';
    if (font === "cursive") fontVal = '"Caveat", "Brush Script MT", cursive';
    if (font === "system") fontVal = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
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

  const syncThemeToDb = (config: {
    theme: Theme;
    accentColor: string;
    fontSize: FontSize;
    fontFamily: FontFamily;
    reducedMotion: boolean;
  }) => {
    fetch("/api/users/theme", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    }).catch((e) => console.log("Failed to sync theme to DB", e));
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

    // Fetch theme settings from server database if logged in
    fetch("/api/users/theme")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.themeSettings) {
          const dbTheme = data.themeSettings.theme || savedTheme;
          const dbAccent = data.themeSettings.accentColor || savedAccent;
          const dbFontSize = data.themeSettings.fontSize || savedFontSize;
          const dbFontFamily = data.themeSettings.fontFamily || savedFontFamily;
          const dbReducedMotion = typeof data.themeSettings.reducedMotion === "boolean" ? data.themeSettings.reducedMotion : savedReducedMotion;

          setThemeState(dbTheme);
          setAccentColorState(dbAccent);
          setFontSizeState(dbFontSize);
          setFontFamilyState(dbFontFamily);
          setReducedMotionState(dbReducedMotion);

          applyTheme(dbTheme);
          applyAccentColor(dbAccent);
          applyFontFamily(dbFontFamily);
          document.documentElement.setAttribute("data-font-size", dbFontSize);
          document.documentElement.setAttribute("data-reduced-motion", dbReducedMotion ? "true" : "false");

          localStorage.setItem("dost_theme", dbTheme);
          localStorage.setItem("dost_accent_color", dbAccent);
          localStorage.setItem("dost_font_size", dbFontSize);
          localStorage.setItem("dost_font_family", dbFontFamily);
          localStorage.setItem("dost_reduced_motion", dbReducedMotion ? "true" : "false");
        }
      })
      .catch((err) => console.log("Server theme load skipped", err));
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("dost_theme", newTheme);
    applyTheme(newTheme);
    syncThemeToDb({
      theme: newTheme,
      accentColor,
      fontSize,
      fontFamily,
      reducedMotion
    });
  };

  const setAccentColor = (newColor: string) => {
    setAccentColorState(newColor);
    localStorage.setItem("dost_accent_color", newColor);
    applyAccentColor(newColor);
    syncThemeToDb({
      theme,
      accentColor: newColor,
      fontSize,
      fontFamily,
      reducedMotion
    });
  };

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    localStorage.setItem("dost_font_size", newSize);
    document.documentElement.setAttribute("data-font-size", newSize);
    syncThemeToDb({
      theme,
      accentColor,
      fontSize: newSize,
      fontFamily,
      reducedMotion
    });
  };

  const setFontFromDob = (dobInput: Date | string | null | undefined) => {
    if (!dobInput) return;
    const birthDate = new Date(dobInput);
    if (isNaN(birthDate.getTime())) return;
    
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    let recommendedSize: FontSize = "md";
    if (age >= 55) {
      recommendedSize = "xxl"; // Senior citizen mode: XXL (18px)
    } else if (age >= 45) {
      recommendedSize = "lg"; // Large (15px)
    }

    setFontSize(recommendedSize);
  };

  const setFontFamily = (newFont: FontFamily) => {
    setFontFamilyState(newFont);
    localStorage.setItem("dost_font_family", newFont);
    applyFontFamily(newFont);
    syncThemeToDb({
      theme,
      accentColor,
      fontSize,
      fontFamily: newFont,
      reducedMotion
    });
  };

  const setReducedMotion = (reduced: boolean) => {
    setReducedMotionState(reduced);
    localStorage.setItem("dost_reduced_motion", reduced ? "true" : "false");
    document.documentElement.setAttribute("data-reduced-motion", reduced ? "true" : "false");
    syncThemeToDb({
      theme,
      accentColor,
      fontSize,
      fontFamily,
      reducedMotion: reduced
    });
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
        setFontFromDob,
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


