"use client";

import { useState } from "react";
import { X, Search, Image as ImageIcon, Sparkles } from "lucide-react";

interface GifPickerModalProps {
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
}

const SAMPLE_GIFS = [
  { id: "1", title: "Excited Celebration", url: "https://media.giphy.com/media/l0amJzVHIAfl7jMDos/giphy.gif" },
  { id: "2", title: "Coding Focus", url: "https://media.giphy.com/media/13Hgw8T855x5a8/giphy.gif" },
  { id: "3", title: "Mind Blown", url: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif" },
  { id: "4", title: "Let's Go!", url: "https://media.giphy.com/media/xT5LMHxhOfscxPfIfm/giphy.gif" },
  { id: "5", title: "Applause", url: "https://media.giphy.com/media/3o7qDEqN68W885mBI4/giphy.gif" },
  { id: "6", title: "Awesome Tech", url: "https://media.giphy.com/media/uVpjHrGt9IURa/giphy.gif" }
];

export function GifPickerModal({ onClose, onSelectGif }: GifPickerModalProps) {
  const [search, setSearch] = useState("");

  const filteredGifs = SAMPLE_GIFS.filter(g => 
    g.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)",
      backdropFilter: "blur(8px)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    }}>
      <div className="glass animate-scale-in" style={{
        width: "100%",
        maxWidth: "480px",
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "24px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "10px",
              background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "white"
            }}>
              <ImageIcon size={18} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              Select a GIF
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Input */}
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          background: "var(--color-bg-base)", border: "1px solid var(--color-border)",
          borderRadius: "99px", padding: "8px 16px"
        }}>
          <Search size={18} style={{ color: "var(--color-text-muted)" }} />
          <input 
            type="text"
            placeholder="Search GIFs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              color: "var(--color-text-main)", fontSize: "0.95rem"
            }}
          />
        </div>

        {/* GIFs Grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px",
          maxHeight: "320px", overflowY: "auto", paddingRight: "4px"
        }}>
          {filteredGifs.map(gif => (
            <div 
              key={gif.id}
              onClick={() => {
                onSelectGif(gif.url);
                onClose();
              }}
              style={{
                position: "relative",
                height: "130px",
                borderRadius: "16px",
                overflow: "hidden",
                cursor: "pointer",
                border: "1px solid var(--color-border)",
                transition: "transform 0.15s ease, border-color 0.15s ease"
              }}
              className="hover:scale-[1.02]"
            >
              <img 
                src={gif.url} 
                alt={gif.title} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              />
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                padding: "8px", color: "white", fontSize: "0.75rem", fontWeight: 700
              }}>
                {gif.title}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
