"use client";

import React, { useRef } from "react";
import { useTheme, FontSize, Theme, FontFamily } from "@/context/ThemeContext";
import { X, Check, Type, Palette, Sparkles, Pipette } from "lucide-react";

export function ThemeModal({ onClose }: { onClose: () => void }) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const { 
    theme, setTheme, 
    accentColor, setAccentColor, 
    fontSize, setFontSize,
    fontFamily, setFontFamily 
  } = useTheme();

  const fontSizes: { id: FontSize; label: string }[] = [
    { id: "xs", label: "XS" },
    { id: "sm", label: "Small" },
    { id: "md", label: "Default" },
    { id: "lg", label: "Large" },
    { id: "xl", label: "XL" },
  ];

  const accentColors = [
    { hex: "#1d9bf0", name: "Blue" },
    { hex: "#ffd400", name: "Yellow" },
    { hex: "#f91880", name: "Pink" },
    { hex: "#7856ff", name: "Purple" },
    { hex: "#ff7a00", name: "Orange" },
    { hex: "#00ba7c", name: "Green" },
    { hex: "#00c6ff", name: "Cyan" },
    { hex: "#ef4444", name: "Red" },
  ];

  const fontFamilies: { id: FontFamily; name: string; sample: string; fontFamily: string }[] = [
    { id: "default", name: "Default System", sample: "Geist Sans", fontFamily: "var(--font-geist-sans), sans-serif" },
    { id: "inter", name: "Inter", sample: "Clean Modern", fontFamily: '"Inter", sans-serif' },
    { id: "roboto", name: "Roboto", sample: "Standard Sans", fontFamily: '"Roboto", sans-serif' },
    { id: "outfit", name: "Outfit", sample: "Sleek Geometric", fontFamily: '"Outfit", sans-serif' },
    { id: "serif", name: "Serif Elegant", sample: "Classic Serif", fontFamily: '"Georgia", serif' },
    { id: "monospace", name: "Monospace Code", sample: "Developer Mono", fontFamily: '"Fira Code", monospace' },
    { id: "cursive", name: "Cursive Script", sample: "Handwriting", fontFamily: '"Caveat", cursive' },
    { id: "system", name: "System Native", sample: "Native UI", fontFamily: "system-ui, sans-serif" },
  ];

  const themes: { id: Theme; label: string; previewBg: string; textCol: string }[] = [
    { id: "dark", label: "Lights Out (Pitch Black)", previewBg: "#000000", textCol: "#e7e9ea" },
    { id: "dim", label: "Dim Dark", previewBg: "#15202b", textCol: "#f7f9f9" },
    { id: "light", label: "Default Light", previewBg: "#ffffff", textCol: "#0f1419" },
  ];

  const isCustomColor = !accentColors.some(c => c.hex.toLowerCase() === accentColor.toLowerCase());

  return (
    <div 
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)", zIndex: 2000,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "12px"
      }}
      onClick={onClose}
    >
      <div 
        className="animate-scale-in"
        style={{
          background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
          borderRadius: "24px", padding: "20px", width: "100%", maxWidth: "500px",
          maxHeight: "90vh", overflowY: "auto",
          display: "flex", flexDirection: "column", gap: "20px", boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
          boxSizing: "border-box"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>Customize Display</h2>
          <button onClick={onClose} style={{ color: "var(--color-text-muted)", background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        {/* Font Size Adjuster */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <Type size={18} style={{ color: "var(--color-primary)" }} />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>Font Size</h3>
          </div>
          
          <div style={{
            background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
            borderRadius: "16px", padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px",
            boxSizing: "border-box"
          }}>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 700, flexShrink: 0 }}>Aa</span>
            <div style={{ display: "flex", gap: "4px", flex: 1, justifyContent: "space-around", flexWrap: "wrap", minWidth: 0 }}>
              {fontSizes.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFontSize(f.id)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: "99px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    background: fontSize === f.id ? "var(--color-primary)" : "transparent",
                    color: fontSize === f.id ? "white" : "var(--color-text-muted)",
                    border: fontSize === f.id ? "none" : "1px solid var(--color-border)",
                    flexShrink: 0
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span style={{ fontSize: "1.1rem", color: "var(--color-text-main)", fontWeight: 800, flexShrink: 0 }}>Aa</span>
          </div>
        </div>

        {/* Accent Color Swatches & Custom Color Palette Picker */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Palette size={18} style={{ color: "var(--color-primary)" }} />
              <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>Accent Color</h3>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 600 }}>{accentColor}</span>
          </div>
          
          <div style={{
            background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
            borderRadius: "16px", padding: "14px", display: "flex", flexDirection: "column", gap: "12px"
          }}>
            {/* Preset Color Swatches */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: "8px" }}>
              {accentColors.map((color) => {
                const isSelected = accentColor.toLowerCase() === color.hex.toLowerCase();
                return (
                  <button
                    key={color.hex}
                    onClick={() => setAccentColor(color.hex)}
                    title={color.name}
                    style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      backgroundColor: color.hex, border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#ffffff", boxShadow: isSelected ? `0 0 14px ${color.hex}` : "none",
                      transform: isSelected ? "scale(1.15)" : "scale(1)",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {isSelected && <Check size={18} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>

            {/* Custom Color Palette Picker Section */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 12px", borderRadius: "12px", background: "rgba(255, 255, 255, 0.03)",
              border: isCustomColor ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
              marginTop: "4px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: isCustomColor ? accentColor : "linear-gradient(135deg, #ff0000, #00ff00, #0000ff)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                }}>
                  <Pipette size={14} color="#ffffff" />
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)" }}>Custom Palette</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Pick any color from wheel</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input 
                  type="text" 
                  value={accentColor} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith("#") && val.length <= 7) {
                      setAccentColor(val);
                    }
                  }}
                  style={{
                    width: "70px", padding: "4px 8px", borderRadius: "8px",
                    border: "1px solid var(--color-border)", background: "var(--color-bg-surface)",
                    color: "var(--color-text-main)", fontSize: "0.8rem", fontWeight: 700, textAlign: "center"
                  }}
                />
                <input 
                  ref={colorInputRef}
                  type="color" 
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{
                    width: "32px", height: "32px", borderRadius: "8px", border: "none",
                    background: "none", cursor: "pointer", padding: 0
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Font Family Selection (8 Diverse Font Options) */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <Sparkles size={18} style={{ color: "var(--color-primary)" }} />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)", margin: 0 }}>Font Family</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {fontFamilies.map((font) => {
              const isSelected = fontFamily === font.id;
              return (
                <button
                  key={font.id}
                  onClick={() => setFontFamily(font.id)}
                  style={{
                    padding: "10px 12px", borderRadius: "12px",
                    background: isSelected ? "rgba(29, 155, 240, 0.12)" : "var(--color-bg-base)",
                    border: isSelected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                    color: "var(--color-text-main)", fontWeight: 700, fontSize: "0.85rem",
                    cursor: "pointer", display: "flex", flexDirection: "column", gap: "2px", alignItems: "flex-start",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{font.name}</span>
                    {isSelected && <Check size={16} style={{ color: "var(--color-primary)" }} />}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontFamily: font.fontFamily, fontStyle: font.id === "cursive" ? "italic" : "normal" }}>
                    {font.sample}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Theme Selector */}
        <div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "10px", margin: "0 0 10px 0" }}>Background Theme</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {themes.map((t) => (
              <div
                key={t.id}
                onClick={() => setTheme(t.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 16px", borderRadius: "14px",
                  background: t.previewBg, border: theme === t.id ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                  cursor: "pointer", transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    border: theme === t.id ? "5px solid var(--color-primary)" : "2px solid #71767b",
                    background: "transparent"
                  }} />
                  <span style={{ color: t.textCol, fontWeight: 700, fontSize: "0.9rem" }}>{t.label}</span>
                </div>
                {theme === t.id && <Check size={18} style={{ color: "var(--color-primary)" }} />}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: "var(--color-primary)", color: "white", padding: "12px",
            borderRadius: "99px", fontWeight: 700, fontSize: "0.95rem", marginTop: "4px", cursor: "pointer", border: "none",
            boxShadow: "0 4px 14px rgba(29, 155, 240, 0.3)"
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}


