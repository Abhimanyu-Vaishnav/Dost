"use client";

import { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon, Video, Type, Loader2, Music, Smile, Palette, Move } from "lucide-react";

interface CreateStoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Overlay = {
  id: string;
  type: "TEXT" | "EMOJI";
  content: string;
  x: number;
  y: number;
  color: string;
  font: string;
  fontSize: number;
};

const BG_COLORS = [
  "linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)",
  "linear-gradient(135deg, #A8C0FF 0%, #3F2B96 100%)",
  "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
  "linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)",
  "#1a1a1a",
];

const FONTS = ["sans-serif", "serif", "monospace", "cursive"];

export function CreateStoryModal({ onClose, onSuccess }: CreateStoryModalProps) {
  const [activeTab, setActiveTab] = useState<"MEDIA" | "TEXT">("MEDIA");
  
  // Media State
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO" | "TEXT">("TEXT");
  const [musicUrl, setMusicUrl] = useState("");
  
  // Text/Bg State
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  
  // Overlays
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  
  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("video/") && file.size > 50 * 1024 * 1024) {
      alert("Video too large.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaUrl(reader.result as string);
      setMediaType(file.type.startsWith("video/") ? "VIDEO" : "IMAGE");
      setActiveTab("MEDIA");
    };
    reader.readAsDataURL(file);
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      alert("Please select an audio file.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setMusicUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addTextOverlay = () => {
    const newOverlay: Overlay = {
      id: Date.now().toString(),
      type: "TEXT",
      content: "Type here...",
      x: 50,
      y: 50,
      color: "#ffffff",
      font: "sans-serif",
      fontSize: 24,
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
  };

  const addEmojiOverlay = (emoji: string) => {
    const newOverlay: Overlay = {
      id: Date.now().toString(),
      type: "EMOJI",
      content: emoji,
      x: 50,
      y: 50,
      color: "#ffffff",
      font: "sans-serif",
      fontSize: 48,
    };
    setOverlays([...overlays, newOverlay]);
    setShowEmojiPicker(false);
  };

  const updateOverlay = (id: string, updates: Partial<Overlay>) => {
    setOverlays(overlays.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOverlay = (id: string) => {
    setOverlays(overlays.filter(o => o.id !== id));
    if (selectedOverlayId === id) setSelectedOverlayId(null);
  };

  const handleSubmit = async () => {
    if (activeTab === "MEDIA" && !mediaUrl) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: activeTab === "MEDIA" ? mediaUrl : undefined,
          mediaType: activeTab === "TEXT" ? "TEXT" : mediaType,
          bgColor: activeTab === "TEXT" ? bgColor : undefined,
          musicUrl: musicUrl || undefined,
          overlays: overlays.length > 0 ? overlays : undefined
        })
      });

      if (res.ok) {
        onSuccess();
      } else {
        throw new Error("Failed to post story");
      }
    } catch (e) {
      console.error(e);
      alert("Error posting story");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "rgba(0,0,0,0.9)", zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      
      {/* Editor Layout: Left Tools, Center Canvas, Right Settings */}
      <div style={{ display: "flex", width: "100%", maxWidth: "1200px", height: "100vh", maxHeight: "900px" }}>
        
        {/* Left Toolbar */}
        <div style={{ width: "80px", display: "flex", flexDirection: "column", gap: "24px", padding: "24px 16px", alignItems: "center" }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "48px", height: "48px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={24} />
          </button>
          
          <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.2)" }} />

          <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <ImageIcon size={28} />
            <span style={{ fontSize: "0.7rem" }}>Media</span>
          </button>
          
          <button onClick={() => setActiveTab("TEXT")} style={{ background: "none", border: "none", color: activeTab === "TEXT" ? "var(--color-primary)" : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <Palette size={28} />
            <span style={{ fontSize: "0.7rem" }}>Bg</span>
          </button>

          <button onClick={addTextOverlay} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <Type size={28} />
            <span style={{ fontSize: "0.7rem" }}>Text</span>
          </button>

          <div style={{ position: "relative" }}>
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <Smile size={28} />
              <span style={{ fontSize: "0.7rem" }}>Sticker</span>
            </button>
            {showEmojiPicker && (
              <div style={{ position: "absolute", top: "0", left: "100%", marginLeft: "16px", background: "#222", padding: "12px", borderRadius: "12px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", zIndex: 50 }}>
                {["😀", "🔥", "❤️", "👍", "😂", "🎉", "✨", "😎"].map(emoji => (
                  <button key={emoji} onClick={() => addEmojiOverlay(emoji)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>{emoji}</button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => musicInputRef.current?.click()} style={{ background: "none", border: "none", color: musicUrl ? "var(--color-primary)" : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <Music size={28} />
            <span style={{ fontSize: "0.7rem" }}>Music</span>
          </button>
        </div>

        {/* Center Canvas */}
        <div style={{ flex: 1, padding: "24px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
          
          {/* Mock Phone Container */}
          <div 
            ref={canvasRef}
            style={{ 
              width: "400px", height: "100%", maxHeight: "800px", borderRadius: "24px", overflow: "hidden", 
              position: "relative", backgroundColor: "#000", background: activeTab === "TEXT" ? bgColor : "#000",
              boxShadow: "0 0 40px rgba(0,0,0,0.5)"
            }}
          >
            {activeTab === "MEDIA" && mediaUrl && (
              mediaType === "IMAGE" ? (
                <img src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} alt="Background" />
              ) : (
                <video src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0 }} autoPlay loop muted />
              )
            )}
            
            {activeTab === "MEDIA" && !mediaUrl && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.5)" }}>
                <ImageIcon size={64} style={{ marginBottom: "16px" }} />
                <p>Select media from the left toolbar</p>
              </div>
            )}

            {/* Overlays Rendering */}
            {overlays.map(overlay => (
              <div
                key={overlay.id}
                onClick={() => setSelectedOverlayId(overlay.id)}
                style={{
                  position: "absolute",
                  left: `${overlay.x}%`,
                  top: `${overlay.y}%`,
                  transform: "translate(-50%, -50%)",
                  cursor: "pointer",
                  border: selectedOverlayId === overlay.id ? "2px dashed rgba(255,255,255,0.5)" : "2px solid transparent",
                  padding: "4px",
                  borderRadius: "8px",
                  zIndex: selectedOverlayId === overlay.id ? 20 : 10
                }}
              >
                {overlay.type === "TEXT" ? (
                  <span style={{ color: overlay.color, fontFamily: overlay.font, fontSize: `${overlay.fontSize}px`, fontWeight: "bold", textShadow: "0 2px 4px rgba(0,0,0,0.8)", whiteSpace: "pre-wrap", textAlign: "center" }}>
                    {overlay.content}
                  </span>
                ) : (
                  <span style={{ fontSize: `${overlay.fontSize}px` }}>{overlay.content}</span>
                )}
              </div>
            ))}
          </div>

        </div>

        {/* Right Settings */}
        <div style={{ width: "300px", background: "#111", borderLeft: "1px solid #333", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
            <h3 style={{ color: "white", fontSize: "1.2rem", marginBottom: "24px", fontWeight: 600 }}>Properties</h3>
            
            {activeTab === "TEXT" && (
              <div style={{ marginBottom: "32px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginBottom: "12px" }}>Background</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  {BG_COLORS.map(bg => (
                    <div 
                      key={bg} 
                      onClick={() => setBgColor(bg)}
                      style={{ 
                        width: "40px", height: "40px", borderRadius: "50%", background: bg, cursor: "pointer",
                        border: bgColor === bg ? "3px solid white" : "none", boxShadow: bgColor === bg ? "0 0 0 2px var(--color-primary)" : "none"
                      }}
                    />
                  ))}
                  <div style={{ position: "relative", width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: !BG_COLORS.includes(bgColor) ? "3px solid white" : "none", boxShadow: !BG_COLORS.includes(bgColor) ? "0 0 0 2px var(--color-primary)" : "none" }}>
                    <div style={{ width: "100%", height: "100%", background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "white", textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>+</span>
                    </div>
                    <input 
                      type="color" 
                      value={!BG_COLORS.includes(bgColor) ? bgColor : "#ffffff"} 
                      onChange={(e) => setBgColor(e.target.value)} 
                      style={{ position: "absolute", top: -10, left: -10, width: "60px", height: "60px", opacity: 0, cursor: "pointer" }} 
                      title="Custom Color"
                    />
                  </div>
                </div>
              </div>
            )}

            {musicUrl && (
              <div style={{ marginBottom: "32px", padding: "16px", background: "rgba(255,255,255,0.05)", borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
                    <Music size={16} /> <span style={{ fontSize: "0.9rem", fontWeight: 600 }}>Audio Track Attached</span>
                  </div>
                  <button onClick={() => setMusicUrl("")} style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer" }}><X size={16} /></button>
                </div>
                <audio src={musicUrl} controls style={{ width: "100%", marginTop: "12px", height: "30px" }} />
              </div>
            )}

            {selectedOverlayId && (
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "16px", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <p style={{ color: "white", fontWeight: 600, margin: 0 }}>Edit Overlay</p>
                  <button onClick={() => deleteOverlay(selectedOverlayId)} style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Remove</button>
                </div>
                
                {overlays.find(o => o.id === selectedOverlayId)?.type === "TEXT" && (
                  <>
                    <input 
                      type="text" 
                      value={overlays.find(o => o.id === selectedOverlayId)?.content || ""}
                      onChange={e => updateOverlay(selectedOverlayId, { content: e.target.value })}
                      style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "white", marginBottom: "16px" }}
                      placeholder="Enter text..."
                    />
                    
                    <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                      {["#ffffff", "#000000", "#FF6B6B", "#4ECDC4", "#FFE66D", "#A8C0FF"].map(c => (
                        <div 
                          key={c}
                          onClick={() => updateOverlay(selectedOverlayId, { color: c })}
                          style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: c, cursor: "pointer", border: overlays.find(o => o.id === selectedOverlayId)?.color === c ? "2px solid var(--color-primary)" : "1px solid rgba(255,255,255,0.2)" }}
                        />
                      ))}
                    </div>

                    <select 
                      value={overlays.find(o => o.id === selectedOverlayId)?.font || "sans-serif"}
                      onChange={e => updateOverlay(selectedOverlayId, { font: e.target.value })}
                      style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "white", marginBottom: "16px" }}
                    >
                      {FONTS.map(f => <option key={f} value={f} style={{ color: "black" }}>{f}</option>)}
                    </select>
                  </>
                )}

                <div>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", marginBottom: "8px" }}>Size</p>
                  <input 
                    type="range" min="12" max="120" 
                    value={overlays.find(o => o.id === selectedOverlayId)?.fontSize || 24}
                    onChange={e => updateOverlay(selectedOverlayId, { fontSize: parseInt(e.target.value) })}
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ marginTop: "16px" }}>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}><Move size={14} /> Position (X/Y %)</p>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input 
                      type="range" min="0" max="100" 
                      value={overlays.find(o => o.id === selectedOverlayId)?.x || 50}
                      onChange={e => updateOverlay(selectedOverlayId, { x: parseInt(e.target.value) })}
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="range" min="0" max="100" 
                      value={overlays.find(o => o.id === selectedOverlayId)?.y || 50}
                      onChange={e => updateOverlay(selectedOverlayId, { y: parseInt(e.target.value) })}
                      style={{ flex: 1 }}
                    />
                  </div>
                </div>

              </div>
            )}
          </div>

          <div style={{ padding: "24px", borderTop: "1px solid #333" }}>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || (activeTab === "MEDIA" && !mediaUrl)}
              style={{
                width: "100%", background: "var(--color-primary)", color: "white", padding: "16px", 
                borderRadius: "99px", fontWeight: 700, border: "none", cursor: "pointer", 
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                opacity: (isSubmitting || (activeTab === "MEDIA" && !mediaUrl)) ? 0.5 : 1
              }}
            >
              {isSubmitting && <Loader2 size={18} className="animate-spin" />}
              Share to Story
            </button>
          </div>
        </div>

      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: "none" }} />
      <input type="file" ref={musicInputRef} onChange={handleMusicChange} accept="audio/*" style={{ display: "none" }} />
    </div>
  );
}
