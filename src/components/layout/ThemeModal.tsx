"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { X, Check } from "lucide-react";

export function ThemeModal({ onClose }: { onClose: () => void }) {
  const { theme, setTheme } = useTheme();

  const themes: { id: "light" | "dark" | "midnight"; label: string; previewBg: string; textCol: string }[] = [
    { id: "light", label: "Default Light", previewBg: "#ffffff", textCol: "#0f1419" },
    { id: "dark", label: "Dim Dark", previewBg: "#15202b", textCol: "#f7f9f9" },
    { id: "midnight", label: "Lights Out Black", previewBg: "#000000", textCol: "#e7e9ea" },
  ];

  return (
    <div 
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
      }}
      onClick={onClose}
    >
      <div 
        className="glass animate-scale-in"
        style={{
          background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
          borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "440px",
          display: "flex", flexDirection: "column", gap: "20px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)" }}>Display & Appearance</h2>
          <button onClick={onClose} style={{ color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
          Manage your color theme and background preferences across Dost.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {themes.map((t) => (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 20px", borderRadius: "16px",
                background: t.previewBg, border: theme === t.id ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                cursor: "pointer", transition: "transform 0.15s ease"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "20px", height: "20px", borderRadius: "50%",
                  border: theme === t.id ? "6px solid var(--color-primary)" : "2px solid #8b98a5",
                  background: "transparent"
                }} />
                <span style={{ color: t.textCol, fontWeight: 700, fontSize: "1rem" }}>{t.label}</span>
              </div>
              {theme === t.id && <Check size={20} style={{ color: "var(--color-primary)" }} />}
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          style={{
            background: "var(--color-primary)", color: "white", padding: "12px",
            borderRadius: "99px", fontWeight: 700, marginTop: "8px", cursor: "pointer"
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}
