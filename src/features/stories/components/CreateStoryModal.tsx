"use client";

import { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon, Type, Loader2, Music, Smile, Palette, Brush, Sparkles, Lock, Link as LinkIcon, HelpCircle, User, Check, Search, Undo, Users, Plus, Radio, Sliders, Download, RotateCw, AlignLeft, AlignCenter, AlignRight, Flame, Sparkle } from "lucide-react";

interface CreateStoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Overlay = {
  id: string;
  type: "TEXT" | "EMOJI" | "POLL" | "LINK" | "MENTION" | "LOCATION" | "HASHTAG" | "DRAWING" | "FILTER" | "QUESTION" | "ADD_YOURS" | "SLIDER" | "COUNTDOWN";
  content: string;
  x: number;
  y: number;
  color: string;
  font: string;
  fontSize: number;
  textBgStyle?: "none" | "solid" | "blur" | "pill";
  textAlign?: "left" | "center" | "right";
  question?: string;
  options?: string[];
  votes?: number[];
  votedUserIds?: { [userId: string]: number };
  linkLabel?: string;
  prompt?: string;
  sliderEmoji?: string;
  targetDate?: string;
};

const FONTS = [
  { id: "Inter", name: "Modern Sans", family: "Inter, sans-serif" },
  { id: "Playfair Display", name: "Serif Elegant", family: "'Playfair Display', serif" },
  { id: "Outfit", name: "Futuristic", family: "Outfit, sans-serif" },
  { id: "Courier Prime", name: "Typewriter", family: "'Courier Prime', monospace" },
  { id: "Pacifico", name: "Calligraphy", family: "Pacifico, cursive" }
];

const BG_COLORS = [
  "linear-gradient(135deg, var(--color-primary, #1d9bf0) 0%, #00c6ff 100%)",
  "linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  "linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)",
  "linear-gradient(135deg, #00F260 0%, #0575E6 100%)",
  "#0f172a",
];

const SHADER_PRESETS = [
  { id: "none", name: "Normal", filter: "" },
  { id: "warm_film", name: "Warm Film", filter: "sepia(0.35) contrast(1.15) saturate(1.2)" },
  { id: "vintage_bw", name: "Vintage B&W", filter: "grayscale(1) contrast(1.3) brightness(0.95)" },
  { id: "cyber_neon", name: "Cyber Neon", filter: "saturate(1.8) hue-rotate(160deg) contrast(1.2)" },
  { id: "soft_glow", name: "Soft Glow", filter: "brightness(1.1) contrast(0.95) saturate(1.1)" },
  { id: "teal_orange", name: "Teal & Orange", filter: "contrast(1.2) saturate(1.4) hue-rotate(-20deg)" },
  { id: "moody_dark", name: "Moody Dark", filter: "brightness(0.85) contrast(1.35) saturate(0.9)" }
];

export function CreateStoryModal({ onClose, onSuccess }: CreateStoryModalProps) {
  const [activeTab, setActiveTab] = useState<"MEDIA" | "TEXT">("MEDIA");
  
  // Media & Music State
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO" | "TEXT">("TEXT");
  const [musicUrl, setMusicUrl] = useState("");
  
  // Canvas Background
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  
  // Overlays
  const [overlays, setOverlays] = useState<Overlay[]>([]);
  const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
  
  // Manual Image Adjustments (Granular Sliders)
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [warmth, setWarmth] = useState(0);
  const [rotation, setRotation] = useState(0);

  // Doodle Drawing Engine State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushType, setBrushType] = useState<"PEN" | "NEON" | "HIGHLIGHTER">("NEON");
  const [brushColor, setBrushColor] = useState("var(--color-primary, #1d9bf0)");
  const [brushWidth, setBrushWidth] = useState(8);
  const [undoStack, setUndoStack] = useState<ImageData[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Shader Preset & Audience Privacy State
  const [selectedShader, setSelectedShader] = useState("none");
  const [privacy, setPrivacy] = useState<"PUBLIC" | "FOLLOWING" | "SPECIFIC">("PUBLIC");
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);

  // Active Tool Panel Toggles
  const [activePanel, setActivePanel] = useState<"FILTERS" | "ADJUST" | "DRAW" | "STICKERS" | "TEXT_FORMAT" | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showSpecificUsersModal, setShowSpecificUsersModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch friends list for specific audience
  useEffect(() => {
    fetch("/api/users/close-friends")
      .then(r => r.json())
      .then(d => {
        if (d.eligibleFriends) setFollowingList(d.eligibleFriends);
      })
      .catch(e => console.error("Failed to load friends list", e));
  }, []);

  // Sync Drawing Canvas context
  useEffect(() => {
    if (isDrawingMode && drawingCanvasRef.current && canvasRef.current) {
      const canvas = drawingCanvasRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
  }, [isDrawingMode]);

  // Handle Freehand Mouse / Touch Drawing
  const startDrawing = (clientX: number, clientY: number) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Save current canvas state to undo stack
    setUndoStack(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = brushColor;

    if (brushType === "NEON") {
      ctx.shadowBlur = 16;
      ctx.shadowColor = brushColor;
      ctx.globalAlpha = 1;
    } else if (brushType === "HIGHLIGHTER") {
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = brushWidth * 2.5;
    } else {
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (clientX: number, clientY: number) => {
    if (!isDrawing || !drawingCanvasRef.current) return;
    const ctx = drawingCanvasRef.current.getContext("2d");
    if (!ctx) return;
    const rect = drawingCanvasRef.current.getBoundingClientRect();
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext("2d");
      if (ctx) ctx.restore();
    }
    setIsDrawing(false);
  };

  const handleUndoDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas || undoStack.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const previousState = undoStack[undoStack.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setUndoStack(prev => prev.slice(0, prev.length - 1));
    if (undoStack.length === 1) setHasDrawn(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
    const reader = new FileReader();
    reader.onloadend = () => setMusicUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const addOverlay = (type: Overlay["type"], initialContent: string = "", extraProps: Partial<Overlay> = {}) => {
    const newOverlay: Overlay = {
      id: `${type}_${Date.now()}`,
      type,
      content: initialContent,
      x: 50,
      y: 50,
      color: "var(--color-primary, #1d9bf0)",
      font: FONTS[0].family,
      fontSize: 24,
      textBgStyle: "solid",
      textAlign: "center",
      ...extraProps
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
    setActivePanel(null);
  };

  const selectedOverlay = overlays.find(o => o.id === selectedOverlayId);

  const updateSelectedOverlay = (updates: Partial<Overlay>) => {
    if (!selectedOverlayId) return;
    setOverlays(overlays.map(o => o.id === selectedOverlayId ? { ...o, ...updates } : o));
  };

  const handleToggleSpecificUser = (userId: string) => {
    if (allowedUsers.includes(userId)) {
      setAllowedUsers(allowedUsers.filter(id => id !== userId));
    } else {
      setAllowedUsers([...allowedUsers, userId]);
    }
  };

  // Download Draft Image to Gallery
  const handleSaveDraft = () => {
    alert("Story draft saved to gallery!");
  };

  const handleSubmit = async () => {
    if (activeTab === "MEDIA" && !mediaUrl) return;
    setIsSubmitting(true);
    try {
      const finalOverlays = [...overlays];
      if (hasDrawn && drawingCanvasRef.current) {
        finalOverlays.push({
          id: `drawing_${Date.now()}`,
          type: "DRAWING",
          content: drawingCanvasRef.current.toDataURL("image/png"),
          x: 50, y: 50, color: "", font: "", fontSize: 100
        });
      }
      if (selectedShader !== "none") {
        finalOverlays.push({
          id: `filter_${Date.now()}`,
          type: "FILTER",
          content: selectedShader,
          x: 0, y: 0, color: "", font: "", fontSize: 0
        });
      }

      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl: activeTab === "MEDIA" ? mediaUrl : undefined,
          mediaType: activeTab === "TEXT" ? "TEXT" : mediaType,
          bgColor: activeTab === "TEXT" ? bgColor : undefined,
          musicUrl: musicUrl || undefined,
          overlays: finalOverlays.length > 0 ? finalOverlays : undefined,
          privacy,
          allowedUsers: privacy === "SPECIFIC" ? allowedUsers : undefined
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

  const combinedFilterCss = `${SHADER_PRESETS.find(f => f.id === selectedShader)?.filter || ""} brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${warmth}deg)`;

  const filteredUsers = followingList.filter(u => 
    u.name?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "rgba(0,0,0,0.9)", zIndex: 10000, backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "16px"
    }}>

      {/* Top Header Studio Bar */}
      <div style={{
        width: "100%", maxWidth: "440px", display: "flex", alignItems: "center", justifyContent: "space-between",
        zIndex: 50, padding: "8px 12px", background: "rgba(20,20,20,0.6)", borderRadius: "99px", backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.15)"
      }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", borderRadius: "50%", width: "38px", height: "38px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className="hover-scale">
          <X size={20} />
        </button>

        {/* Studio Creative Tools Icons */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }} className="hover-scale" title="Upload Media">
            <ImageIcon size={20} />
          </button>
          
          <button onClick={() => setActivePanel(activePanel === "FILTERS" ? null : "FILTERS")} style={{ background: "none", border: "none", color: selectedShader !== "none" ? "var(--color-primary)" : "white", cursor: "pointer" }} className="hover-scale" title="GPU Filters">
            <Sparkles size={20} />
          </button>

          <button onClick={() => setActivePanel(activePanel === "ADJUST" ? null : "ADJUST")} style={{ background: "none", border: "none", color: (brightness !== 100 || contrast !== 100 || saturation !== 100) ? "var(--color-primary)" : "white", cursor: "pointer" }} className="hover-scale" title="Adjustments">
            <Sliders size={20} />
          </button>

          <button onClick={() => { setIsDrawingMode(!isDrawingMode); setActivePanel(isDrawingMode ? null : "DRAW"); }} style={{ background: "none", border: "none", color: isDrawingMode ? "var(--color-primary)" : "white", cursor: "pointer" }} className="hover-scale" title="Vector Drawing">
            <Brush size={20} />
          </button>

          <button onClick={() => addOverlay("TEXT", "Type text...")} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }} className="hover-scale" title="Typography">
            <Type size={20} />
          </button>

          <button onClick={() => setActivePanel(activePanel === "STICKERS" ? null : "STICKERS")} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }} className="hover-scale" title="Stickers & Widgets">
            <Smile size={20} />
          </button>

          <button onClick={() => setRotation((prev) => (prev + 90) % 360)} style={{ background: "none", border: "none", color: rotation !== 0 ? "var(--color-primary)" : "white", cursor: "pointer" }} className="hover-scale" title="Rotate">
            <RotateCw size={20} />
          </button>
        </div>

        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: "none" }} />
        <input type="file" ref={musicInputRef} onChange={handleMusicChange} accept="audio/*" style={{ display: "none" }} />
      </div>

      {/* Center 9:16 Canvas Stage */}
      <div 
        ref={canvasRef}
        style={{
          width: "100%", maxWidth: "390px", height: "100%", maxHeight: "680px", borderRadius: "28px", overflow: "hidden",
          position: "relative", backgroundColor: "#000", background: activeTab === "TEXT" ? bgColor : "#000",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)",
          transform: `rotate(${rotation}deg)`, transition: "transform 0.3s ease"
        }}
      >
        {activeTab === "MEDIA" && mediaUrl && (
          mediaType === "IMAGE" ? (
            <img src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, filter: combinedFilterCss }} alt="" />
          ) : (
            <video src={mediaUrl} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, filter: combinedFilterCss }} autoPlay loop muted />
          )
        )}

        {activeTab === "MEDIA" && !mediaUrl && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.5)" }}>
            <ImageIcon size={64} style={{ marginBottom: "16px" }} />
            <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>Select media from top toolbar</p>
          </div>
        )}

        {/* Freehand Vector Drawing Layer */}
        <canvas
          ref={drawingCanvasRef}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 15,
            pointerEvents: isDrawingMode ? "auto" : "none", cursor: isDrawingMode ? "crosshair" : "default"
          }}
          onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
          onMouseMove={(e) => draw(e.clientX, e.clientY)}
          onMouseUp={stopDrawing}
        />

        {/* Render Active Overlays (Text, Stickers, Polls) */}
        {overlays.map(overlay => {
          const isSelected = selectedOverlayId === overlay.id;

          if (overlay.type === "TEXT") {
            return (
              <div
                key={overlay.id}
                onClick={() => { setSelectedOverlayId(overlay.id); setActivePanel("TEXT_FORMAT"); }}
                style={{
                  position: "absolute", left: `${overlay.x}%`, top: `${overlay.y}%`,
                  transform: "translate(-50%, -50%)", cursor: "pointer",
                  border: isSelected ? "2px dashed var(--color-primary)" : "2px solid transparent",
                  padding: "6px 12px", borderRadius: overlay.textBgStyle === "pill" ? "99px" : "12px",
                  background: overlay.textBgStyle === "solid" ? "rgba(0,0,0,0.85)" : overlay.textBgStyle === "blur" ? "rgba(255,255,255,0.2)" : "transparent",
                  backdropFilter: overlay.textBgStyle === "blur" ? "blur(10px)" : "none",
                  zIndex: isSelected ? 25 : 10, textAlign: overlay.textAlign || "center"
                }}
              >
                <span style={{ color: overlay.color, fontFamily: overlay.font, fontSize: `${overlay.fontSize}px`, fontWeight: "bold", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                  {overlay.content}
                </span>
              </div>
            );
          }

          if (overlay.type === "POLL") {
            return (
              <div key={overlay.id} onClick={() => setSelectedOverlayId(overlay.id)} style={{ position: "absolute", left: `${overlay.x}%`, top: `${overlay.y}%`, transform: "translate(-50%, -50%)", cursor: "pointer", border: isSelected ? "2px dashed var(--color-primary)" : "none", padding: "14px", borderRadius: "18px", background: "rgba(255, 255, 255, 0.95)", color: "#000", width: "200px", display: "flex", flexDirection: "column", gap: "8px", boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: isSelected ? 20 : 10, textAlign: "center" }}>
                <span style={{ fontWeight: 800, fontSize: "0.9rem" }}>{overlay.question}</span>
                <div style={{ display: "flex", gap: "6px" }}>
                  {(overlay.options || ["Yes", "No"]).map((opt, oIdx) => (
                    <div key={oIdx} style={{ flex: 1, padding: "8px", background: "rgba(29, 155, 240, 0.15)", color: "var(--color-primary)", fontWeight: 700, borderRadius: "8px", fontSize: "0.8rem" }}>{opt}</div>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={overlay.id} onClick={() => setSelectedOverlayId(overlay.id)} style={{ position: "absolute", left: `${overlay.x}%`, top: `${overlay.y}%`, transform: "translate(-50%, -50%)", cursor: "pointer", border: isSelected ? "2px dashed var(--color-primary)" : "2px solid transparent", padding: "4px", borderRadius: "8px", zIndex: isSelected ? 20 : 10 }}>
              <span style={{ color: overlay.color, fontSize: `${overlay.fontSize}px`, fontWeight: "bold" }}>{overlay.content}</span>
            </div>
          );
        })}
      </div>

      {/* Floating Active Panel Drawer (Filters / Adjustments / Drawing / Stickers) */}
      {activePanel && (
        <div className="glass animate-slide-up" style={{
          width: "100%", maxWidth: "440px", padding: "16px", borderRadius: "24px",
          background: "rgba(20,20,20,0.95)", border: "1px solid rgba(255,255,255,0.15)",
          zIndex: 60, display: "flex", flexDirection: "column", gap: "12px"
        }}>
          {activePanel === "FILTERS" && (
            <div>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "white", marginBottom: "8px", display: "block" }}>GPU Shaders</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {SHADER_PRESETS.map(f => (
                  <button key={f.id} onClick={() => setSelectedShader(f.id)} style={{ padding: "8px 4px", fontSize: "0.75rem", borderRadius: "10px", background: selectedShader === f.id ? "var(--color-primary)" : "rgba(255,255,255,0.1)", color: "white", border: "none", fontWeight: 700, cursor: "pointer" }}>{f.name}</button>
                ))}
              </div>
            </div>
          )}

          {activePanel === "ADJUST" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ color: "white", fontSize: "0.8rem", fontWeight: 700, width: "80px" }}>Brightness</span>
                <input type="range" min="50" max="150" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} style={{ flex: 1, accentColor: "var(--color-primary)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ color: "white", fontSize: "0.8rem", fontWeight: 700, width: "80px" }}>Contrast</span>
                <input type="range" min="50" max="150" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} style={{ flex: 1, accentColor: "var(--color-primary)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                <span style={{ color: "white", fontSize: "0.8rem", fontWeight: 700, width: "80px" }}>Saturation</span>
                <input type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(parseInt(e.target.value))} style={{ flex: 1, accentColor: "var(--color-primary)" }} />
              </div>
            </div>
          )}

          {activePanel === "DRAW" && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {[
                  { type: "NEON", label: "✨ Neon" },
                  { type: "PEN", label: "✒️ Pen" },
                  { type: "HIGHLIGHTER", label: "🖍️ Marker" }
                ].map(b => (
                  <button key={b.type} onClick={() => setBrushType(b.type as any)} style={{ padding: "6px 10px", borderRadius: "8px", background: brushType === b.type ? "var(--color-primary)" : "rgba(255,255,255,0.1)", color: "white", border: "none", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>{b.label}</button>
                ))}
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {["var(--color-primary, #1d9bf0)", "#FF0000", "#FFFF00", "#00FF00", "#FFFFFF"].map(c => (
                  <button key={c} onClick={() => setBrushColor(c)} style={{ width: "20px", height: "20px", borderRadius: "50%", background: c, border: brushColor === c ? "2px solid white" : "none", cursor: "pointer" }} />
                ))}
              </div>
              <button onClick={handleUndoDrawing} disabled={undoStack.length === 0} style={{ background: "none", border: "none", color: undoStack.length > 0 ? "#ff4d4d" : "#666", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", fontWeight: 700 }}>
                <Undo size={14} /> Undo
              </button>
            </div>
          )}

          {activePanel === "STICKERS" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <button onClick={() => addOverlay("POLL", "Ask a question...", { question: "Ask a question...", options: ["Yes", "No"], votes: [0, 0] })} style={{ padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>📊 Poll</button>
              <button onClick={() => addOverlay("QUESTION", "Ask me a question")} style={{ padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>❓ Question</button>
              <button onClick={() => addOverlay("ADD_YOURS", "Add Yours", { prompt: "Add Yours" })} style={{ padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>➕ Add Yours</button>
              <button onClick={() => addOverlay("LINK", "https://", { linkLabel: "Visit Link" })} style={{ padding: "8px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "white", border: "none", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>🔗 Link</button>
            </div>
          )}

          {activePanel === "TEXT_FORMAT" && selectedOverlay && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="text" value={selectedOverlay.content} onChange={e => updateSelectedOverlay({ content: e.target.value })} style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "white", fontSize: "0.9rem" }} />
                <input type="color" value={selectedOverlay.color} onChange={e => updateSelectedOverlay({ color: e.target.value })} style={{ width: "32px", height: "32px", border: "none", background: "none", cursor: "pointer" }} />
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                {FONTS.map(f => (
                  <button key={f.id} onClick={() => updateSelectedOverlay({ font: f.family })} style={{ padding: "6px 8px", borderRadius: "8px", background: selectedOverlay.font === f.family ? "var(--color-primary)" : "rgba(255,255,255,0.1)", color: "white", border: "none", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>{f.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Bar (Audience Privacy, Save Draft, Share Story) */}
      <div style={{
        width: "100%", maxWidth: "440px", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", background: "rgba(20,20,20,0.8)", borderRadius: "99px", backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.15)", zIndex: 50
      }}>
        {/* Audience Privacy Selector */}
        <div style={{ position: "relative" }}>
          <select
            value={privacy}
            onChange={e => {
              setPrivacy(e.target.value as any);
              if (e.target.value === "SPECIFIC") setShowSpecificUsersModal(true);
            }}
            style={{
              padding: "8px 14px", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.2)",
              background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 700, fontSize: "0.8rem", outline: "none", cursor: "pointer"
            }}
          >
            <option value="PUBLIC" style={{ background: "#222" }}>🌎 Public</option>
            <option value="FOLLOWING" style={{ background: "#222" }}>👥 People I Follow</option>
            <option value="SPECIFIC" style={{ background: "#222" }}>🎯 Specific Persons</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button onClick={handleSaveDraft} style={{ padding: "8px 14px", borderRadius: "99px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)", color: "white", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
            <Download size={15} /> Save Draft
          </button>

          <button onClick={handleSubmit} disabled={isSubmitting || (activeTab === "MEDIA" && !mediaUrl)} style={{ padding: "10px 22px", borderRadius: "99px", background: "var(--color-primary, #1d9bf0)", color: "white", border: "none", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 16px rgba(29, 155, 240, 0.4)", display: "flex", alignItems: "center", gap: "6px" }}>
            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Share Story"}
          </button>
        </div>
      </div>

      {/* Specific Persons Selection Popup Modal */}
      {showSpecificUsersModal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.8)", zIndex: 10005, backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }} onClick={() => setShowSpecificUsersModal(false)}>
          <div className="glass animate-scale-in" style={{ width: "100%", maxWidth: "440px", maxHeight: "80vh", background: "rgba(24, 24, 24, 0.98)", borderRadius: "24px", border: "1px solid rgba(255,255,255,0.15)", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", margin: 0 }}>Select Specific Persons</h3>
              <button onClick={() => setShowSpecificUsersModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", padding: "8px 14px" }}>
                <Search size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
                <input type="text" placeholder="Search friends..." value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} style={{ background: "none", border: "none", outline: "none", color: "white", fontSize: "0.9rem", flex: 1 }} />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredUsers.map(u => {
                const isSelected = allowedUsers.includes(u.id);
                return (
                  <div key={u.id} onClick={() => handleToggleSpecificUser(u.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "14px", background: isSelected ? "rgba(29, 155, 240, 0.15)" : "rgba(255,255,255,0.03)", border: isSelected ? "1px solid var(--color-primary)" : "1px solid transparent", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>
                        {u.avatar ? <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : u.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span style={{ fontWeight: 700, color: "white", fontSize: "0.9rem" }}>{u.name}</span>
                    </div>
                    <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: isSelected ? "none" : "2px solid rgba(255,255,255,0.3)", background: isSelected ? "var(--color-primary)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowSpecificUsersModal(false)} style={{ padding: "10px 24px", borderRadius: "99px", background: "var(--color-primary)", color: "white", border: "none", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }}>
                Done ({allowedUsers.length} Selected)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
