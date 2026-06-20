"use client";

import { useState, useRef, useEffect } from "react";
import { X, Image as ImageIcon, Type, Loader2, Music, Smile, Palette, Move, Brush, Sparkles, Lock, Link as LinkIcon, HelpCircle, User, Check, Search, Undo } from "lucide-react";

interface CreateStoryModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Overlay = {
  id: string;
  type: "TEXT" | "EMOJI" | "POLL" | "LINK" | "MENTION" | "LOCATION" | "HASHTAG" | "DRAWING" | "FILTER";
  content: string;
  x: number;
  y: number;
  color: string;
  font: string;
  fontSize: number;
  // Poll fields
  question?: string;
  options?: string[];
  votes?: number[];
  votedUserIds?: { [userId: string]: number };
  // Link fields
  linkLabel?: string;
};

const BG_COLORS = [
  "linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)",
  "linear-gradient(135deg, #A8C0FF 0%, #3F2B96 100%)",
  "linear-gradient(135deg, #f12711 0%, #f5af19 100%)",
  "linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)",
  "#1a1a1a",
];

const FONTS = ["sans-serif", "serif", "monospace", "cursive"];

const FILTERS = [
  { id: "none", name: "Normal", value: "" },
  { id: "grayscale", name: "B&W", value: "grayscale(1)" },
  { id: "sepia", name: "Sepia", value: "sepia(1)" },
  { id: "vintage", name: "Vintage", value: "sepia(0.5) contrast(1.2) brightness(0.9)" },
  { id: "cool", name: "Cool", value: "saturate(1.2) hue-rotate(15deg)" },
  { id: "warm", name: "Warm", value: "sepia(0.3) saturate(1.3) contrast(1.1)" }
];

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
  
  // Doodle Drawing State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#FF0000");
  const [brushWidth, setBrushWidth] = useState(5);
  const [hasDrawn, setHasDrawn] = useState(false);

  // CSS Filter State
  const [selectedFilter, setSelectedFilter] = useState("none");

  // Privacy State
  const [privacy, setPrivacy] = useState<"PUBLIC" | "FRIENDS" | "CLOSE_FRIENDS" | "SPECIFIC">("PUBLIC");
  const [allowedUsers, setAllowedUsers] = useState<string[]>([]);
  const [closeFriendIds, setCloseFriendIds] = useState<string[]>([]);
  const [eligibleFriends, setEligibleFriends] = useState<any[]>([]);

  // Modal UI States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showWidgetPicker, setShowWidgetPicker] = useState(false);
  const [showCloseFriendsModal, setShowCloseFriendsModal] = useState(false);
  const [showSpecificFriendsModal, setShowSpecificFriendsModal] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch Friends lists on load
  useEffect(() => {
    const fetchFriendsData = async () => {
      try {
        const res = await fetch("/api/users/close-friends");
        if (res.ok) {
          const data = await res.json();
          setCloseFriendIds(data.closeFriendIds || []);
          setEligibleFriends(data.eligibleFriends || []);
        }
      } catch (e) {
        console.error("Failed to load close friends list", e);
      }
    };
    fetchFriendsData();
  }, []);

  // Sync drawing canvas size with phone mock screen container
  useEffect(() => {
    if (isDrawingMode && drawingCanvasRef.current && canvasRef.current) {
      const canvas = drawingCanvasRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Fill canvas context settings
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushWidth;
      }
    }
  }, [isDrawingMode]);

  // Update brush settings in canvas context
  useEffect(() => {
    if (drawingCanvasRef.current) {
      const ctx = drawingCanvasRef.current.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushWidth;
      }
    }
  }, [brushColor, brushWidth]);

  // Mouse/Touch Drawing Logic
  const startDrawing = (clientX: number, clientY: number) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (clientX: number, clientY: number) => {
    if (!isDrawing) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setHasDrawn(false);
  };

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

  // Add Overlays
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

  const addPollOverlay = () => {
    const newOverlay: Overlay = {
      id: "poll_" + Date.now().toString(),
      type: "POLL",
      content: "Ask a question...",
      question: "Ask a question...",
      options: ["Yes", "No"],
      votes: [0, 0],
      votedUserIds: {},
      x: 50,
      y: 50,
      color: "var(--color-primary)",
      font: "sans-serif",
      fontSize: 20
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
    setShowWidgetPicker(false);
  };

  const addLinkOverlay = () => {
    const newOverlay: Overlay = {
      id: "link_" + Date.now().toString(),
      type: "LINK",
      content: "https://",
      linkLabel: "Link",
      x: 50,
      y: 60,
      color: "#ffffff",
      font: "sans-serif",
      fontSize: 18
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
    setShowWidgetPicker(false);
  };

  const addMentionOverlay = () => {
    const newOverlay: Overlay = {
      id: "mention_" + Date.now().toString(),
      type: "MENTION",
      content: "@name",
      x: 50,
      y: 40,
      color: "#ffffff",
      font: "sans-serif",
      fontSize: 22
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
    setShowWidgetPicker(false);
  };

  const addLocationOverlay = () => {
    const newOverlay: Overlay = {
      id: "location_" + Date.now().toString(),
      type: "LOCATION",
      content: "Location",
      x: 50,
      y: 30,
      color: "#ffffff",
      font: "sans-serif",
      fontSize: 18
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
    setShowWidgetPicker(false);
  };

  const addHashtagOverlay = () => {
    const newOverlay: Overlay = {
      id: "hashtag_" + Date.now().toString(),
      type: "HASHTAG",
      content: "#hashtag",
      x: 50,
      y: 45,
      color: "#ffffff",
      font: "sans-serif",
      fontSize: 20
    };
    setOverlays([...overlays, newOverlay]);
    setSelectedOverlayId(newOverlay.id);
    setShowWidgetPicker(false);
  };

  const updateOverlay = (id: string, updates: Partial<Overlay>) => {
    setOverlays(overlays.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOverlay = (id: string) => {
    setOverlays(overlays.filter(o => o.id !== id));
    if (selectedOverlayId === id) setSelectedOverlayId(null);
  };

  // Close Friends List Update
  const handleToggleCloseFriend = (friendId: string) => {
    if (closeFriendIds.includes(friendId)) {
      setCloseFriendIds(closeFriendIds.filter(id => id !== friendId));
    } else {
      setCloseFriendIds([...closeFriendIds, friendId]);
    }
  };

  const handleSaveCloseFriends = async () => {
    try {
      const res = await fetch("/api/users/close-friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closeFriendIds })
      });
      if (res.ok) {
        setShowCloseFriendsModal(false);
      }
    } catch (e) {
      alert("Failed to save close friends list");
    }
  };

  // Specific Friends List Update
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
      // 1. Gather all overlays
      const finalOverlays = [...overlays];

      // 2. Export Doodle drawing layer to overlay if drawn
      if (hasDrawn && drawingCanvasRef.current) {
        const dataUrl = drawingCanvasRef.current.toDataURL("image/png");
        finalOverlays.push({
          id: "drawing_" + Date.now().toString(),
          type: "DRAWING",
          content: dataUrl,
          x: 50,
          y: 50,
          color: "",
          font: "",
          fontSize: 100
        });
      }

      // 3. Append filter meta overlay
      if (selectedFilter !== "none") {
        finalOverlays.push({
          id: "filter_" + Date.now().toString(),
          type: "FILTER",
          content: selectedFilter,
          x: 0,
          y: 0,
          color: "",
          font: "",
          fontSize: 0
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

  // Filter friends list based on search query
  const filteredFriends = eligibleFriends.filter(f => 
    f.name?.toLowerCase().includes(friendSearchQuery.toLowerCase())
  );

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "rgba(0,0,0,0.9)", zIndex: 10000,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      
      {/* Editor Layout: Left Tools, Center Canvas, Right Settings */}
      <div style={{ display: "flex", width: "100%", maxWidth: "1200px", height: "100vh", maxHeight: "900px", position: "relative" }}>
        
        {/* Left Toolbar */}
        <div style={{ width: "80px", display: "flex", flexDirection: "column", gap: "20px", padding: "20px 16px", alignItems: "center" }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", borderRadius: "50%", width: "48px", height: "48px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={24} />
          </button>
          
          <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.2)" }} />

          <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <ImageIcon size={26} />
            <span style={{ fontSize: "0.65rem" }}>Media</span>
          </button>
          
          <button onClick={() => setActiveTab("TEXT")} style={{ background: "none", border: "none", color: activeTab === "TEXT" ? "var(--color-primary)" : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <Palette size={26} />
            <span style={{ fontSize: "0.65rem" }}>Bg</span>
          </button>

          <button onClick={addTextOverlay} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <Type size={26} />
            <span style={{ fontSize: "0.65rem" }}>Text</span>
          </button>

          {/* Doodle Pen Button */}
          <button onClick={() => setIsDrawingMode(!isDrawingMode)} style={{ background: "none", border: "none", color: isDrawingMode ? "var(--color-primary)" : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <Brush size={26} />
            <span style={{ fontSize: "0.65rem" }}>Draw</span>
          </button>

          {/* Widgets/Stickers Button */}
          <div style={{ position: "relative" }}>
            <button onClick={() => { setShowWidgetPicker(!showWidgetPicker); setShowEmojiPicker(false); }} style={{ background: "none", border: "none", color: "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <Smile size={26} />
              <span style={{ fontSize: "0.65rem" }}>Stickers</span>
            </button>
            
            {showWidgetPicker && (
              <div style={{ position: "absolute", top: "0", left: "100%", marginLeft: "16px", background: "#222", padding: "12px", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "8px", zIndex: 100, minWidth: "160px", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: "1px solid #333" }}>
                <button onClick={() => setShowEmojiPicker(true)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px", borderRadius: "8px" }} className="hover-bg">😀 Emoji</button>
                <button onClick={addPollOverlay} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px", borderRadius: "8px" }} className="hover-bg">📊 Poll</button>
                <button onClick={addLinkOverlay} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px", borderRadius: "8px" }} className="hover-bg">🔗 Link</button>
                <button onClick={addMentionOverlay} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px", borderRadius: "8px" }} className="hover-bg">👤 Mention</button>
                <button onClick={addLocationOverlay} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px", borderRadius: "8px" }} className="hover-bg">📍 Location</button>
                <button onClick={addHashtagOverlay} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", color: "white", cursor: "pointer", padding: "8px", borderRadius: "8px" }} className="hover-bg">#️⃣ Hashtag</button>
              </div>
            )}

            {showEmojiPicker && (
              <div style={{ position: "absolute", top: "0", left: "100%", marginLeft: "16px", background: "#222", padding: "12px", borderRadius: "12px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", zIndex: 101 }}>
                {["😀", "🔥", "❤️", "👍", "😂", "🎉", "✨", "😎", "🥰", "🥳", "😭", "😮"].map(emoji => (
                  <button key={emoji} onClick={() => addEmojiOverlay(emoji)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>{emoji}</button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => musicInputRef.current?.click()} style={{ background: "none", border: "none", color: musicUrl ? "var(--color-primary)" : "white", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            <Music size={26} />
            <span style={{ fontSize: "0.65rem" }}>Music</span>
          </button>
        </div>

        {/* Center Canvas */}
        <div style={{ flex: 1, padding: "24px", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexDirection: "column" }}>
          
          {/* Drawing brush settings bar if in drawing mode */}
          {isDrawingMode && (
            <div className="glass" style={{ display: "flex", gap: "16px", alignItems: "center", padding: "8px 20px", borderRadius: "99px", marginBottom: "12px", zIndex: 50 }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {["#FF0000", "#FFFF00", "#00FF00", "#00FFFF", "#0000FF", "#FF00FF", "#FFFFFF", "#000000"].map(c => (
                  <button key={c} onClick={() => setBrushColor(c)} style={{ width: "20px", height: "20px", borderRadius: "50%", background: c, border: brushColor === c ? "2px solid white" : "1px solid #666", cursor: "pointer" }} />
                ))}
              </div>
              <input type="range" min="1" max="25" value={brushWidth} onChange={e => setBrushWidth(parseInt(e.target.value))} style={{ width: "80px" }} />
              <button onClick={clearDrawing} style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", fontWeight: 700 }}>
                <Undo size={14} /> Clear
              </button>
              <button onClick={() => setIsDrawingMode(false)} style={{ background: "var(--color-primary)", color: "white", border: "none", padding: "4px 12px", borderRadius: "12px", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
                Done
              </button>
            </div>
          )}

          {/* Mock Phone Container */}
          <div 
            ref={canvasRef}
            style={{ 
              width: "380px", height: "100%", maxHeight: "760px", borderRadius: "24px", overflow: "hidden", 
              position: "relative", backgroundColor: "#000", background: activeTab === "TEXT" ? bgColor : "#000",
              boxShadow: "0 0 40px rgba(0,0,0,0.5)"
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
                <p>Select media from the left toolbar</p>
              </div>
            )}

            {/* Drawing Canvas */}
            <canvas
              ref={drawingCanvasRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 15,
                pointerEvents: isDrawingMode ? "auto" : "none",
                cursor: isDrawingMode ? "crosshair" : "default"
              }}
              onMouseDown={(e) => startDrawing(e.clientX, e.clientY)}
              onMouseMove={(e) => draw(e.clientX, e.clientY)}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={(e) => startDrawing(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={(e) => draw(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={stopDrawing}
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
                      border: isSelected ? "2px dashed rgba(255,255,255,0.8)" : "none",
                      padding: "16px", borderRadius: "20px",
                      background: "rgba(255, 255, 255, 0.95)", color: "#000",
                      width: "220px", display: "flex", flexDirection: "column", gap: "10px",
                      boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: isSelected ? 20 : 10,
                      fontFamily: overlay.font, textAlign: "center"
                    }}
                  >
                    <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>{overlay.question}</span>
                    <div style={{ display: "flex", gap: "8px" }}>
                      {(overlay.options || ["Yes", "No"]).map((opt, oIdx) => (
                        <div key={oIdx} style={{ flex: 1, padding: "8px", background: "var(--color-primary-light)", color: "var(--color-primary)", fontWeight: 700, borderRadius: "10px", fontSize: "0.85rem" }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (overlay.type === "LINK") {
                return (
                  <div
                    key={overlay.id}
                    onClick={() => setSelectedOverlayId(overlay.id)}
                    style={{
                      position: "absolute", left: `${overlay.x}%`, top: `${overlay.y}%`,
                      transform: "translate(-50%, -50%)", cursor: "pointer",
                      border: isSelected ? "2px dashed rgba(255,255,255,0.8)" : "none",
                      padding: "8px 16px", borderRadius: "99px",
                      background: "rgba(29, 155, 240, 0.95)", color: "#fff",
                      fontWeight: 700, fontSize: "0.9rem", boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
                      display: "flex", alignItems: "center", gap: "6px", zIndex: isSelected ? 20 : 10
                    }}
                  >
                    <LinkIcon size={14} /> {overlay.linkLabel}
                  </div>
                );
              }

              if (overlay.type === "MENTION" || overlay.type === "HASHTAG" || overlay.type === "LOCATION") {
                const colorMap = {
                  MENTION: { bg: "rgba(255,255,255,0.9)", text: "var(--color-primary)", fw: 800 },
                  HASHTAG: { bg: "rgba(255, 230, 109, 0.95)", text: "#000", fw: 800 },
                  LOCATION: { bg: "rgba(255,255,255,0.9)", text: "#000", fw: 700 }
                };
                const styleOpt = colorMap[overlay.type as "MENTION" | "HASHTAG" | "LOCATION"];
                return (
                  <div
                    key={overlay.id}
                    onClick={() => setSelectedOverlayId(overlay.id)}
                    style={{
                      position: "absolute", left: `${overlay.x}%`, top: `${overlay.y}%`,
                      transform: "translate(-50%, -50%)", cursor: "pointer",
                      border: isSelected ? "2px dashed rgba(0,0,0,0.5)" : "none",
                      padding: "6px 14px", borderRadius: "12px",
                      background: styleOpt.bg, color: styleOpt.text,
                      fontWeight: styleOpt.fw, fontSize: `${overlay.fontSize}px`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      display: "flex", alignItems: "center", gap: "4px", zIndex: isSelected ? 20 : 10
                    }}
                  >
                    {overlay.type === "LOCATION" && "📍 "}
                    {overlay.content}
                  </div>
                );
              }

              return (
                <div
                  key={overlay.id}
                  onClick={() => setSelectedOverlayId(overlay.id)}
                  style={{
                    position: "absolute",
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                    transform: "translate(-50%, -50%)",
                    cursor: "pointer",
                    border: isSelected ? "2px dashed rgba(255,255,255,0.5)" : "2px solid transparent",
                    padding: "4px",
                    borderRadius: "8px",
                    zIndex: isSelected ? 20 : 10
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
              );
            })}
          </div>
        </div>

        {/* Right Settings */}
        <div style={{ width: "320px", background: "#111", borderLeft: "1px solid #333", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px", flex: 1, overflowY: "auto" }}>
            <h3 style={{ color: "white", fontSize: "1.2rem", marginBottom: "20px", fontWeight: 600 }}>Properties</h3>
            
            {/* 1. Privacy Settings (New) */}
            <div style={{ marginBottom: "28px", background: "rgba(255,255,255,0.03)", padding: "16px", borderRadius: "16px", border: "1px solid #222" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "white", marginBottom: "12px", fontWeight: 700 }}>
                <Lock size={16} /> Privacy Setting
              </div>
              <select
                value={privacy}
                onChange={e => {
                  const val = e.target.value as any;
                  setPrivacy(val);
                  if (val === "CLOSE_FRIENDS") setShowCloseFriendsModal(true);
                  if (val === "SPECIFIC") setShowSpecificFriendsModal(true);
                }}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "#222", color: "white", fontWeight: 600 }}
              >
                <option value="PUBLIC">🌎 Public (Everyone)</option>
                <option value="FRIENDS">👥 Friends (Followers)</option>
                <option value="CLOSE_FRIENDS">⭐ Close Friends</option>
                <option value="SPECIFIC">🎯 Specific Persons</option>
              </select>
              {privacy === "CLOSE_FRIENDS" && (
                <button 
                  onClick={() => setShowCloseFriendsModal(true)}
                  style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, marginTop: "8px", padding: 0 }}
                >
                  Edit Close Friends list ({closeFriendIds.length} members)
                </button>
              )}
              {privacy === "SPECIFIC" && (
                <button 
                  onClick={() => setShowSpecificFriendsModal(true)}
                  style={{ background: "none", border: "none", color: "var(--color-primary)", cursor: "pointer", fontSize: "0.8rem", fontWeight: 700, marginTop: "8px", padding: 0 }}
                >
                  Selected {allowedUsers.length} Users
                </button>
              )}
            </div>

            {/* 2. CSS filters selection */}
            {activeTab === "MEDIA" && mediaUrl && (
              <div style={{ marginBottom: "24px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}><Sparkles size={14} /> Color Filters</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                  {FILTERS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id)}
                      style={{
                        padding: "8px 4px", fontSize: "0.8rem", borderRadius: "8px", cursor: "pointer",
                        background: selectedFilter === f.id ? "var(--color-primary)" : "#222",
                        color: "white", border: "none", fontWeight: 600, transition: "background 0.2s"
                      }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === "TEXT" && (
              <div style={{ marginBottom: "24px" }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginBottom: "12px" }}>Background</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                  {BG_COLORS.map(bg => (
                    <div 
                      key={bg} 
                      onClick={() => setBgColor(bg)}
                      style={{ 
                        width: "36px", height: "36px", borderRadius: "50%", background: bg, cursor: "pointer",
                        border: bgColor === bg ? "3px solid white" : "none", boxShadow: bgColor === bg ? "0 0 0 2px var(--color-primary)" : "none"
                      }}
                    />
                  ))}
                  <div style={{ position: "relative", width: "36px", height: "36px", borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: !BG_COLORS.includes(bgColor) ? "3px solid white" : "none", boxShadow: !BG_COLORS.includes(bgColor) ? "0 0 0 2px var(--color-primary)" : "none" }}>
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
              <div style={{ marginBottom: "24px", padding: "14px", background: "rgba(255,255,255,0.05)", borderRadius: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-primary)" }}>
                    <Music size={14} /> <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Audio Track Attached</span>
                  </div>
                  <button onClick={() => setMusicUrl("")} style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer" }}><X size={14} /></button>
                </div>
                <audio src={musicUrl} controls style={{ width: "100%", marginTop: "8px", height: "26px" }} />
              </div>
            )}

            {selectedOverlayId && (
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "16px", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <p style={{ color: "white", fontWeight: 600, margin: 0 }}>Edit Overlay</p>
                  <button onClick={() => deleteOverlay(selectedOverlayId)} style={{ background: "none", border: "none", color: "#ff4d4d", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>Remove</button>
                </div>
                
                {/* 3. Render specific editors based on overlay type */}
                {(() => {
                  const o = overlays.find(item => item.id === selectedOverlayId);
                  if (!o) return null;

                  if (o.type === "POLL") {
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                        <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>Question</label>
                        <input 
                          type="text" 
                          value={o.question || ""}
                          onChange={e => updateOverlay(selectedOverlayId, { question: e.target.value, content: e.target.value })}
                          style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "white" }}
                        />
                        <div style={{ display: "flex", gap: "6px" }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>Option 1</label>
                            <input 
                              type="text" 
                              value={o.options?.[0] || ""}
                              onChange={e => {
                                const newOpts = [...(o.options || ["Yes", "No"])];
                                newOpts[0] = e.target.value;
                                updateOverlay(selectedOverlayId, { options: newOpts });
                              }}
                              style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "white", marginTop: "4px" }}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.75rem" }}>Option 2</label>
                            <input 
                              type="text" 
                              value={o.options?.[1] || ""}
                              onChange={e => {
                                const newOpts = [...(o.options || ["Yes", "No"])];
                                newOpts[1] = e.target.value;
                                updateOverlay(selectedOverlayId, { options: newOpts });
                              }}
                              style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "white", marginTop: "4px" }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (o.type === "LINK") {
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                        <div>
                          <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>URL</label>
                          <input 
                            type="text" 
                            value={o.content || ""}
                            onChange={e => updateOverlay(selectedOverlayId, { content: e.target.value })}
                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "white", marginTop: "4px" }}
                          />
                        </div>
                        <div>
                          <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>Button Label</label>
                          <input 
                            type="text" 
                            value={o.linkLabel || ""}
                            onChange={e => updateOverlay(selectedOverlayId, { linkLabel: e.target.value })}
                            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "white", marginTop: "4px" }}
                          />
                        </div>
                      </div>
                    );
                  }

                  if (o.type === "MENTION" || o.type === "HASHTAG" || o.type === "LOCATION" || o.type === "TEXT") {
                    return (
                      <>
                        <input 
                          type="text" 
                          value={o.content}
                          onChange={e => updateOverlay(selectedOverlayId, { content: e.target.value })}
                          style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "white", marginBottom: "16px" }}
                          placeholder={o.type === "MENTION" ? "Enter @username..." : o.type === "HASHTAG" ? "Enter #hashtag..." : "Enter text..."}
                        />
                        
                        {o.type === "TEXT" && (
                          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                            {["#ffffff", "#000000", "#FF6B6B", "#4ECDC4", "#FFE66D", "#A8C0FF"].map(c => (
                              <div 
                                key={c}
                                onClick={() => updateOverlay(selectedOverlayId, { color: c })}
                                style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: c, cursor: "pointer", border: o.color === c ? "2px solid var(--color-primary)" : "1px solid rgba(255,255,255,0.2)" }}
                              />
                            ))}
                          </div>
                        )}

                        {o.type === "TEXT" && (
                          <select 
                            value={o.font || "sans-serif"}
                            onChange={e => updateOverlay(selectedOverlayId, { font: e.target.value })}
                            style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.1)", color: "white", marginBottom: "16px" }}
                          >
                            {FONTS.map(f => <option key={f} value={f} style={{ color: "black" }}>{f}</option>)}
                          </select>
                        )}
                      </>
                    );
                  }
                  return null;
                })()}

                {/* Shared controls: size and location */}
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

      {/* 4. Edit Close Friends Modal Popup */}
      {showCloseFriendsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20000 }}>
          <div className="glass" style={{ width: "90%", maxWidth: "420px", borderRadius: "24px", background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "80%" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0, 200, 83, 0.1)" }}>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: "1.2rem", color: "#00c853", display: "flex", alignItems: "center", gap: "8px" }}>⭐ Close Friends</h4>
              <button onClick={() => setShowCloseFriendsModal(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            
            {/* Search filter */}
            <div style={{ padding: "16px 20px", display: "flex", gap: "10px", alignItems: "center", background: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border)" }}>
              <Search size={18} color="var(--color-text-muted)" />
              <input 
                type="text" placeholder="Search friends..." value={friendSearchQuery} onChange={e => setFriendSearchQuery(e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--color-text-main)", fontSize: "0.95rem" }}
              />
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
              {filteredFriends.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)" }}>No friends found.</div>
              ) : (
                filteredFriends.map(f => {
                  const isCloseFriend = closeFriendIds.includes(f.id);
                  return (
                    <div 
                      key={f.id} 
                      onClick={() => handleToggleCloseFriend(f.id)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "12px", cursor: "pointer", transition: "background 0.2s" }}
                      className="hover-bg"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontWeight: 700, color: "var(--color-primary)" }}>
                          {f.avatar ? <img src={f.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : f.name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>{f.name}</span>
                      </div>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #00c853", background: isCloseFriend ? "#00c853" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                        {isCloseFriend && <Check size={12} strokeWidth={4} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ padding: "20px", borderTop: "1px solid var(--color-border)", display: "flex", gap: "12px" }}>
              <button onClick={() => setShowCloseFriendsModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)", background: "none", color: "var(--color-text-main)", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSaveCloseFriends} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "#00c853", color: "white", fontWeight: 700, cursor: "pointer" }}>Save List</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Specific Persons Modal Popup */}
      {showSpecificFriendsModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20000 }}>
          <div className="glass" style={{ width: "90%", maxWidth: "420px", borderRadius: "24px", background: "var(--color-bg-surface)", border: "1px solid var(--color-border)", overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "80%" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: "1.2rem", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "8px" }}>🎯 Share with Specific Users</h4>
              <button onClick={() => setShowSpecificFriendsModal(false)} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}><X size={20} /></button>
            </div>
            
            <div style={{ padding: "16px 20px", display: "flex", gap: "10px", alignItems: "center", background: "var(--color-bg-base)", borderBottom: "1px solid var(--color-border)" }}>
              <Search size={18} color="var(--color-text-muted)" />
              <input 
                type="text" placeholder="Search friends..." value={friendSearchQuery} onChange={e => setFriendSearchQuery(e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--color-text-main)", fontSize: "0.95rem" }}
              />
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
              {filteredFriends.length === 0 ? (
                <div style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)" }}>No friends found.</div>
              ) : (
                filteredFriends.map(f => {
                  const isSelected = allowedUsers.includes(f.id);
                  return (
                    <div 
                      key={f.id} 
                      onClick={() => handleToggleSpecificUser(f.id)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "12px", cursor: "pointer", transition: "background 0.2s" }}
                      className="hover-bg"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", fontWeight: 700, color: "var(--color-primary)" }}>
                          {f.avatar ? <img src={f.avatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : f.name?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--color-text-main)" }}>{f.name}</span>
                      </div>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid var(--color-primary)", background: isSelected ? "var(--color-primary)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                        {isSelected && <Check size={12} strokeWidth={4} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={{ padding: "20px", borderTop: "1px solid var(--color-border)", display: "flex", gap: "12px" }}>
              <button onClick={() => setShowSpecificFriendsModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid var(--color-border)", background: "none", color: "var(--color-text-main)", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => setShowSpecificFriendsModal(false)} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "var(--color-primary)", color: "white", fontWeight: 700, cursor: "pointer" }}>Apply ({allowedUsers.length})</button>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ display: "none" }} />
      <input type="file" ref={musicInputRef} onChange={handleMusicChange} accept="audio/*" style={{ display: "none" }} />
    </div>
  );
}
