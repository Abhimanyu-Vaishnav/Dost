"use client";

import { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon, Type, Loader2, Music, Smile, Palette, Brush, Sparkles, Lock, Link as LinkIcon, HelpCircle, User, Check, Search, Undo, Users, Plus, Radio } from "lucide-react";

interface CreateStoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Overlay = {
  id: string;
  type: "TEXT" | "EMOJI" | "POLL" | "LINK" | "MENTION" | "LOCATION" | "HASHTAG" | "DRAWING" | "FILTER" | "QUESTION" | "ADD_YOURS";
  content: string;
  x: number;
  y: number;
  color: string;
  font: string;
  fontSize: number;
  question?: string;
  options?: string[];
  votes?: number[];
  votedUserIds?: { [userId: string]: number };
  linkLabel?: string;
  prompt?: string;
};

const BG_COLORS = [
  "linear-gradient(135deg, var(--color-primary, #1d9bf0) 0%, #00c6ff 100%)",
  "linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  "linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)",
  "linear-gradient(135deg, #00F260 0%, #0575E6 100%)",
  "#0f172a",
];

const FILTERS = [
  { id: "none", name: "Normal", value: "" },
  { id: "grayscale", name: "B&W", value: "grayscale(1)" },
  { id: "sepia", name: "Sepia", value: "sepia(1)" },
  { id: "vintage", name: "Vintage", value: "sepia(0.5) contrast(1.2) brightness(0.9)" },
  { id: "cool", name: "Cool Glow", value: "saturate(1.3) hue-rotate(15deg)" },
  { id: "warm", name: "Warm Sun", value: "sepia(0.3) saturate(1.3) contrast(1.1)" }
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
  
  // Doodle Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("var(--color-primary, #1d9bf0)");
  const [brushWidth, setBrushWidth] = useState(6);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Filter & Privacy State
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [privacy, setPrivacy] = useState<"PUBLIC" | "FOLLOWING" | "SPECIFIC">("PUBLIC");
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);

  // UI Popovers
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showSpecificUsersModal, setShowSpecificUsersModal] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch friends list for specific person selection
  useEffect(() => {
    fetch("/api/users/close-friends")
      .then(r => r.json())
      .then(d => {
        if (d.eligibleFriends) {
          setFollowingList(d.eligibleFriends);
        }
      })
      .catch(e => console.error("Failed to load friends list", e));
  }, []);

  // Sync canvas size
  useEffect(() => {
    if (isDrawingMode && drawingCanvasRef.current && canvasRef.current) {
      const canvas = drawingCanvasRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushWidth;
      }
    }
  }, [isDrawingMode]);

  useEffect(() => {
    if (drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushWidth;
      }
    }
  }, [brushColor, brushWidth]);

  const startDrawing = (clientX: number, clientY: number) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
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

  const stopDrawing = () => setIsDrawing(false);

  const clearDrawing = () => {
    if (drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    }
    setHasDrawn(false);
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
      font: "sans-serif",
      fontSize: 22,
      ...extraProps
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
    setShowWidgetPicker(false);
    setShowEmojiPicker(false);
  };

  const handleToggleSpecificUser = (userId: string) => {
    if (allowedUsers.includes(userId)) {
      setAllowedUsers(allowedUsers.filter(id => id !== userId));
    } else {
      setAllowedUsers([...allowedUsers, userId]);
    }
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
      if (selectedFilter !== "none") {
        finalOverlays.push({
          id: `filter_${Date.now()}`,
          type: "FILTER",
          content: selectedFilter,
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

  const filteredUsers = followingList.filter(u => 
    u.name?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "rgba(0,0,0,0.85)", zIndex: 10000, backdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      
      <div style={{ display: "flex", width: "100%", maxWidth: "1150px", height: "100vh", maxHeight: "880px", position: "relative" }}>
        
        {/* Left Floating Dock Toolbar */}
        <div style={{ width: "84px", display: "flex", flexDirection: "column", gap: "18px", padding: "24px 16px", alignItems: "center" }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "white", borderRadius: "50%", width: "44px", height: "44px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} className="hover-scale">
            <X size={22} />
          </button>
          
          <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.15)" }} />

          <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }} className="hover-scale">
            <ImageIcon size={24} />
            <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>Media</span>
          </button>
          
          <button onClick={() => setActiveTab("TEXT")} style={{ background: "none", border: "none", color: activeTab === "TEXT" ? "var(--color-primary)" : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }} className="hover-scale">
            <Palette size={24} />
            <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>Bg</span>
          </button>

          <button onClick={() => addOverlay("TEXT", "Type text...")} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }} className="hover-scale">
            <Type size={24} />
            <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>Text</span>
          </button>

          <button onClick={() => setIsDrawingMode(!isDrawingMode)} style={{ background: "none", border: "none", color: isDrawingMode ? "var(--color-primary)" : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }} className="hover-scale">
            <Brush size={24} />
            <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>Draw</span>
          </button>

          {/* Stickers Menu Trigger */}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowWidgetPicker(!showWidgetPicker); setShowEmojiPicker(false); }} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }} className="hover-scale">
              <Smile size={24} />
              <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>Stickers</span>
            </button>
            
            {showWidgetPicker && (
              <div className="glass animate-scale-in" style={{ position: "absolute", top: "0", left: "100%", marginLeft: "16px", background: "rgba(20,20,20,0.95)", padding: "12px", borderRadius: "20px", display: "flex", flexDirection: "column", gap: "8px", zIndex: 100, minWidth: "180px", boxShadow: "0 14px 40px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}>
                <button onClick={() => setShowEmojiPicker(true)} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "10px", borderRadius: "12px", fontWeight: 600, fontSize: "0.85rem" }} className="hover-bg">😀 Emojis</button>
                <button onClick={() => addOverlay("POLL", "Ask a question...", { question: "Ask a question...", options: ["Yes", "No"], votes: [0, 0] })} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "10px", borderRadius: "12px", fontWeight: 600, fontSize: "0.85rem" }} className="hover-bg">📊 Poll / Quiz</button>
                <button onClick={() => addOverlay("QUESTION", "Ask me a question", { question: "Ask me a question" })} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "10px", borderRadius: "12px", fontWeight: 600, fontSize: "0.85rem" }} className="hover-bg">❓ Question</button>
                <button onClick={() => addOverlay("ADD_YOURS", "Add Yours", { prompt: "Add Yours" })} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "10px", borderRadius: "12px", fontWeight: 600, fontSize: "0.85rem" }} className="hover-bg">➕ Add Yours</button>
                <button onClick={() => addOverlay("LINK", "https://", { linkLabel: "Visit Link" })} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "10px", borderRadius: "12px", fontWeight: 600, fontSize: "0.85rem" }} className="hover-bg">🔗 Link</button>
                <button onClick={() => addOverlay("MENTION", "@handle")} style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "10px", borderRadius: "12px", fontWeight: 600, fontSize: "0.85rem" }} className="hover-bg">👤 Mention</button>
              </div>
            )}

            {showEmojiPicker && (
              <div className="glass animate-scale-in" style={{ position: "absolute", top: "0", left: "100%", marginLeft: "16px", background: "rgba(20,20,20,0.95)", padding: "14px", borderRadius: "18px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", zIndex: 101, border: "1px solid rgba(255,255,255,0.15)" }}>
                {["😀", "🔥", "❤️", "👍", "😂", "🎉", "✨", "😎", "🥰", "🥳", "😭", "😮"].map(emoji => (
                  <button key={emoji} onClick={() => addOverlay("EMOJI", emoji, { fontSize: 48 })} style={{ background: "none", border: "none", fontSize: "26px", cursor: "pointer" }} className="hover-scale">{emoji}</button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => musicInputRef.current?.click()} style={{ background: "none", border: "none", color: musicUrl ? "var(--color-primary)" : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }} className="hover-scale">
            <Music size={24} />
            <span style={{ fontSize: "0.68rem", fontWeight: 600 }}>Music</span>
          </button>
          
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: "none" }} />
          <input type="file" ref={musicInputRef} onChange={handleMusicChange} accept="audio/*" style={{ display: "none" }} />
        </div>

        {/* Center Canvas Phone Mockup */}
        <div style={{ flex: 1, padding: "20px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexDirection: "column" }}>
          
          {/* Drawing brush settings bar */}
          {isDrawingMode && (
            <div className="glass" style={{ display: "flex", gap: "16px", alignItems: "center", padding: "10px 24px", borderRadius: "99px", marginBottom: "14px", zIndex: 50, border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                {["var(--color-primary, #1d9bf0)", "#FF0000", "#FFFF00", "#00FF00", "#FF00FF", "#FFFFFF", "#000000"].map(c => (
                  <button key={c} onClick={() => setBrushColor(c)} style={{ width: "22px", height: "22px", borderRadius: "50%", background: c, border: brushColor === c ? "2px solid white" : "1px solid #666", cursor: "pointer" }} />
                ))}
              </div>
              <input type="range" min="1" max="25" value={brushWidth} onChange={e => setBrushWidth(parseInt(e.target.value))} style={{ width: "80px", accentColor: "var(--color-primary)" }} />
              <button onClick={clearDrawing} style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: 700 }}>
                <Undo size={15} /> Clear
              </button>
              <button onClick={() => setIsDrawingMode(false)} style={{ background: "var(--color-primary)", color: "white", border: "none", padding: "6px 16px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}>
                Done
              </button>
            </div>
          )}

          <div 
            ref={canvasRef}
            style={{ 
              width: "380px", height: "100%", maxHeight: "740px", borderRadius: "28px", overflow: "hidden", 
              position: "relative", backgroundColor: "#000", background: activeTab === "TEXT" ? bgColor : "#000",
              boxShadow: "0 20px 60px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            {activeTab === "MEDIA" && mediaUrl && (
              mediaType === "IMAGE" ? (
                <img 
                  src={mediaUrl} 
                  style={{ 
                    width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0,
                    filter: FILTERS.find(f => f.id === selectedFilter)?.value || ""
                  }} 
                  alt="Background" 
                />
              ) : (
                <video 
                  src={mediaUrl} 
                  style={{ 
                    width: "100%", height: "100%", objectFit: "cover", position: "absolute", top: 0, left: 0,
                    filter: FILTERS.find(f => f.id === selectedFilter)?.value || ""
                  }} 
                  autoPlay loop muted 
                />
              )
            )}
            
            {activeTab === "MEDIA" && !mediaUrl && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "rgba(255,255,255,0.5)" }}>
                <ImageIcon size={64} style={{ marginBottom: "16px" }} />
                <p style={{ fontWeight: 600, fontSize: "0.95rem" }}>Select media from left toolbar</p>
              </div>
            )}

            {/* Drawing Canvas Layer */}
            <canvas
              ref={drawingCanvasRef}
              style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 15,
                pointerEvents: isDrawingMode ? "auto" : "none", cursor: isDrawingMode ? "crosshair" : "default"
              }}
              onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
              onMouseMove={(e) => draw(e.clientX, e.clientY)}
              onMouseUp={stopDrawing}
            />

            {/* Overlays Rendering */}
            {overlays.map(overlay => {
              const isSelected = selectedOverlayId === overlay.id;
              
              if (overlay.type === "POLL") {
                return (
                  <div
                    key={overlay.id}
                    onClick={() => setSelectedOverlayId(overlay.id)}
                    style={{
                      position: "absolute", left: `${overlay.x}%`, top: `${overlay.y}%`,
                      transform: "translate(-50%, -50%)", cursor: "pointer",
                      border: isSelected ? "2px dashed var(--color-primary)" : "none",
                      padding: "16px", borderRadius: "20px",
                      background: "rgba(255, 255, 255, 0.95)", color: "#000",
                      width: "220px", display: "flex", flexDirection: "column", gap: "10px",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: isSelected ? 20 : 10,
                      textAlign: "center"
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>{overlay.question}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {(overlay.options || ["Yes", "No"]).map((opt, oIdx) => (
                        <div key={oIdx} style={{ flex: 1, padding: "8px", background: "rgba(29, 155, 240, 0.15)", color: "var(--color-primary)", fontWeight: 700, borderRadius: "10px", fontSize: "0.85rem" }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (overlay.type === "QUESTION") {
                return (
                  <div
                    key={overlay.id}
                    onClick={() => setSelectedOverlayId(overlay.id)}
                    style={{
                      position: "absolute", left: `${overlay.x}%`, top: `${overlay.y}%`,
                      transform: "translate(-50%, -50%)", cursor: "pointer",
                      border: isSelected ? "2px dashed var(--color-primary)" : "none",
                      padding: "14px", borderRadius: "18px", background: "rgba(255, 255, 255, 0.95)",
                      color: "#000", width: "200px", display: "flex", flexDirection: "column", gap: "8px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.2)", textAlign: "center", zIndex: isSelected ? 20 : 10
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "var(--color-primary)", fontWeight: 800, fontSize: "0.85rem" }}>
                      <HelpCircle size={16} /> {overlay.question}
                    </div>
                    <div style={{ padding: "8px 12px", borderRadius: "99px", background: "#f0f2f5", fontSize: "0.8rem", color: "#888" }}>
                      Type answer...
                    </div>
                  </div>
                );
              }

              if (overlay.type === "ADD_YOURS") {
                return (
                  <div
                    key={overlay.id}
                    onClick={() => setSelectedOverlayId(overlay.id)}
                    style={{
                      position: "absolute", left: `${overlay.x}%`, top: `${overlay.y}%`,
                      transform: "translate(-50%, -50%)", cursor: "pointer",
                      border: isSelected ? "2px dashed white" : "none",
                      padding: "10px 18px", borderRadius: "16px",
                      background: "linear-gradient(45deg, var(--color-primary), #00c6ff)",
                      color: "#fff", fontWeight: 800, fontSize: "0.85rem", boxShadow: "0 6px 20px rgba(29, 155, 240, 0.4)",
                      display: "flex", alignItems: "center", gap: "8px", zIndex: isSelected ? 20 : 10
                    }}
                  >
                    <Plus size={16} /> {overlay.prompt}
                  </div>
                );
              }

              return (
                <div
                  key={overlay.id}
                  onClick={() => setSelectedOverlayId(overlay.id)}
                  style={{
                    position: "absolute", left: `${overlay.x}%`, top: `${overlay.y}%`,
                    transform: "translate(-50%, -50%)", cursor: "pointer",
                    border: isSelected ? "2px dashed var(--color-primary)" : "2px solid transparent",
                    padding: "4px", borderRadius: "8px", zIndex: isSelected ? 20 : 10
                  }}
                >
                  <span style={{ color: overlay.color, fontFamily: overlay.font, fontSize: `${overlay.fontSize}px`, fontWeight: "bold", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                    {overlay.content}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Settings Sidebar */}
        <div style={{ width: "320px", background: "rgba(18, 18, 18, 0.95)", borderLeft: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
            <h3 style={{ color: "white", fontSize: "1.15rem", marginBottom: "24px", fontWeight: 800 }}>Story Settings</h3>
            
            {/* 1. Privacy Tier Selector */}
            <div style={{ marginBottom: "28px", background: "rgba(255,255,255,0.04)", padding: "18px", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", marginBottom: "14px", fontWeight: 800, fontSize: "0.95rem" }}>
                <Lock size={18} style={{ color: "var(--color-primary)" }} /> Audience Privacy
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                  { value: "PUBLIC", label: "🌎 Public (Everyone)", desc: "Visible to all Dost users" },
                  { value: "FOLLOWING", label: "👥 People I Follow", desc: "Only creators you follow can view" },
                  { value: "SPECIFIC", label: "🎯 Specific Persons", desc: "Handpick custom view list" }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setPrivacy(item.value as any);
                      if (item.value === "SPECIFIC") setShowSpecificUsersModal(true);
                    }}
                    style={{
                      display: "flex", flexDirection: "column", textAlign: "left", gap: "2px",
                      padding: "12px 14px", borderRadius: "14px",
                      border: privacy === item.value ? "2px solid var(--color-primary)" : "1px solid rgba(255,255,255,0.1)",
                      background: privacy === item.value ? "rgba(29, 155, 240, 0.12)" : "rgba(255,255,255,0.02)",
                      color: privacy === item.value ? "var(--color-primary)" : "white", cursor: "pointer"
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: "0.88rem" }}>{item.label}</span>
                    <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>{item.desc}</span>
                  </button>
                ))}
              </div>

              {privacy === "SPECIFIC" && (
                <button 
                  onClick={() => setShowSpecificUsersModal(true)}
                  style={{
                    marginTop: "12px", width: "100%", padding: "10px", borderRadius: "12px",
                    background: "var(--color-primary)", color: "white", border: "none",
                    fontWeight: 700, fontSize: "0.85rem", cursor: "pointer"
                  }}
                >
                  Edit Specific List ({allowedUsers.length} selected)
                </button>
              )}
            </div>

            {/* 2. Color Filters */}
            {activeTab === "MEDIA" && mediaUrl && (
              <div style={{ marginBottom: "28px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginBottom: "10px", fontWeight: 700 }}><Sparkles size={14} /> Preset Filters</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      style={{
                        padding: "10px 4px", fontSize: "0.8rem", borderRadius: "12px", cursor: "pointer",
                        background: selectedFilter === f.id ? "var(--color-primary)" : "rgba(255,255,255,0.06)",
                        color: "white", border: "none", fontWeight: 700
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Share Story Button */}
          <div style={{ padding: "20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (activeTab === "MEDIA" && !mediaUrl)}
              style={{
                width: "100%", padding: "16px", borderRadius: "99px",
                background: "var(--color-primary, #1d9bf0)", color: "white",
                border: "none", fontWeight: 800, fontSize: "1rem", cursor: "pointer",
                boxShadow: "0 6px 20px rgba(29, 155, 240, 0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
              }}
            >
              {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : "Share Story"}
            </button>
          </div>
        </div>

      </div>

      {/* Specific Persons Selection Modal Popup */}
      {showSpecificUsersModal && (
        <div 
          style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.8)", zIndex: 10005, backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
          }}
          onClick={() => setShowSpecificUsersModal(false)}
        >
          <div 
            className="glass animate-scale-in"
            style={{
              width: "100%", maxWidth: "440px", maxHeight: "80vh", background: "rgba(24, 24, 24, 0.98)",
              borderRadius: "24px", border: "1px solid rgba(255,255,255,0.15)",
              display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.6)"
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "white", margin: 0 }}>
                Select Specific Persons
              </h3>
              <button onClick={() => setShowSpecificUsersModal(false)} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.06)", borderRadius: "99px", padding: "8px 14px" }}>
                <Search size={16} style={{ color: "rgba(255,255,255,0.5)" }} />
                <input 
                  type="text"
                  placeholder="Search friends..."
                  value={userSearchQuery}
                  onChange={e => setUserSearchQuery(e.target.value)}
                  style={{ background: "none", border: "none", outline: "none", color: "white", fontSize: "0.9rem", flex: 1 }}
                />
              </div>
            </div>

            {/* Users List */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredUsers.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", padding: "20px 0", fontSize: "0.9rem" }}>
                  No friends found
                </p>
              ) : (
                filteredUsers.map(u => {
                  const isSelected = allowedUsers.includes(u.id);
                  return (
                    <div 
                      key={u.id}
                      onClick={() => handleToggleSpecificUser(u.id)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 14px", borderRadius: "14px",
                        background: isSelected ? "rgba(29, 155, 240, 0.15)" : "rgba(255,255,255,0.03)",
                        border: isSelected ? "1px solid var(--color-primary)" : "1px solid transparent",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700 }}>
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            u.name?.charAt(0).toUpperCase() || "?"
                          )}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 700, color: "white", fontSize: "0.9rem" }}>{u.name}</span>
                        </div>
                      </div>

                      <div style={{
                        width: "22px", height: "22px", borderRadius: "50%",
                        border: isSelected ? "none" : "2px solid rgba(255,255,255,0.3)",
                        background: isSelected ? "var(--color-primary)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "white"
                      }}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setShowSpecificUsersModal(false)}
                style={{
                  padding: "10px 24px", borderRadius: "99px", background: "var(--color-primary)",
                  color: "white", border: "none", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer"
                }}
              >
                Done ({allowedUsers.length} Selected)
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
