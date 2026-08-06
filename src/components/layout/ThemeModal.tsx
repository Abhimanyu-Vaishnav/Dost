"use client";

import React from "react";
import { useTheme, FontSize, Theme } from "@/context/ThemeContext";
import { X, Check, Type } from "lucide-react";

export function ThemeModal({ onClose }: { onClose: () => void }) {
  const { theme, setTheme, fontSize, setFontSize } = useTheme();

  const fontSizes: { id: FontSize; label: string; px: string }[] = [
    { id: "xs", label: "XS", px: "12px" },
    { id: "sm", label: "Small", px: "13px" },
    { id: "md", label: "Default", px: "14px" },
    { id: "lg", label: "Large", px: "15px" },
    { id: "xl", label: "XL", px: "16px" },
  ];

  const themes: { id: Theme; label: string; previewBg: string; textCol: string }[] = [
    { id: "dark", label: "Lights Out (Pitch Black)", previewBg: "#000000", textCol: "#e7e9ea" },
    { id: "dim", label: "Dim Dark", previewBg: "#15202b", textCol: "#f7f9f9" },
    { id: "light", label: "Default Light", previewBg: "#ffffff", textCol: "#0f1419" },
  ];

  return (
    <div 
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)", zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
      }}
      onClick={onClose}
    >
      <div 
        className="animate-scale-in"
        style={{
          background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
          borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "480px",
          display: "flex", flexDirection: "column", gap: "24px", boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)" }}>Customize Display</h2>
          <button onClick={onClose} style={{ color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        {/* Font Size Adjuster */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Type size={18} style={{ color: "var(--color-primary)" }} />
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-main)" }}>Font Size</h3>
          </div>
          
          <div style={{
            background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
            borderRadius: "16px", padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px"
          }}>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", fontWeight: 600 }}>Aa</span>
            <div style={{ display: "flex", gap: "8px", flex: 1, justifyContent: "center" }}>
              {fontSizes.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontSize(f.id)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "99px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    background: fontSize === f.id ? "var(--color-primary)" : "transparent",
                    color: fontSize === f.id ? "white" : "var(--color-text-muted)",
                    border: fontSize === f.id ? "none" : "1px solid var(--color-border)"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: "1.2rem", color: "var(--color-text-main)", fontWeight: 700 }}>Aa</span>
          </div>
        </div>

        {/* Color Theme Selector */}
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "12px" }}>Background Theme</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {themes.map((t) => (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 18px", borderRadius: "16px",
                  background: t.previewBg, border: theme === t.id ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                  cursor: "pointer", transition: "transform 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "50%",
                    border: theme === t.id ? "6px solid var(--color-primary)" : "2px solid #71767b",
                    background: "transparent"
                  }} />
                  <span style={{ color: t.textCol, fontWeight: 700, fontSize: "0.95rem" }}>{t.label}</span>
                </div>
                {theme === t.id && <Check size={20} style={{ color: "var(--color-primary)" }} />}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "var(--color-primary)", color: "white", padding: "12px",
            borderRadius: "99px", fontWeight: 700, fontSize: "0.95rem", marginTop: "4px", cursor: "pointer"
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

