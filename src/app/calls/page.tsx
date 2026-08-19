"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCall } from "@/context/CallContext";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Video,
  Search,
  Clock,
  Calendar,
  User,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CallsHistoryPage() {
  const { startCall } = useCall();
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"ALL" | "MISSED" | "INCOMING" | "OUTGOING">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchCallHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/calls/history?filter=${activeFilter}&q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls || []);
      }
    } catch (err) {
      console.error("Fetch call history error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, [activeFilter, searchQuery]);

  const formatCallDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "0s";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatCallDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const renderDirectionIcon = (direction: string) => {
    switch (direction) {
      case "MISSED":
        return <PhoneMissed size={16} style={{ color: "#ef4444" }} />;
      case "OUTGOING":
        return <PhoneOutgoing size={16} style={{ color: "#00f2fe" }} />;
      default:
        return <PhoneIncoming size={16} style={{ color: "#10b981" }} />;
    }
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "20px 16px", minHeight: "100vh" }}>
        {/* Header Title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(0, 242, 254, 0.2), rgba(16, 185, 129, 0.2))",
                border: "1px solid rgba(0, 242, 254, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00f2fe",
              }}
            >
              <Phone size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>Call History</h1>
              <p style={{ fontSize: "0.8rem", color: "#94a3b8", margin: 0 }}>View past voice and video calls</p>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 16px",
              backgroundColor: "rgba(16, 18, 24, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 14,
            }}
          >
            <Search size={18} style={{ color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search call logs by user name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontSize: "0.9rem",
                outline: "none",
                width: "100%",
              }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {[
              { id: "ALL", label: "All Calls" },
              { id: "MISSED", label: "Missed" },
              { id: "INCOMING", label: "Incoming" },
              { id: "OUTGOING", label: "Outgoing" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 9999,
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  border: activeFilter === tab.id ? "1px solid #00f2fe" : "1px solid rgba(255, 255, 255, 0.1)",
                  backgroundColor: activeFilter === tab.id ? "rgba(0, 242, 254, 0.15)" : "rgba(255, 255, 255, 0.04)",
                  color: activeFilter === tab.id ? "#00f2fe" : "#94a3b8",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Call Logs List */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: 72,
                  borderRadius: 16,
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                }}
              />
            ))}
          </div>
        ) : calls.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              backgroundColor: "rgba(16, 18, 24, 0.4)",
              borderRadius: 20,
              border: "1px border rgba(255, 255, 255, 0.06)",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 12px auto",
                color: "#64748b",
              }}
            >
              <Phone size={26} />
            </div>
            <h3 style={{ color: "#ffffff", margin: "0 0 6px 0", fontSize: "1.1rem" }}>No Call History</h3>
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0 }}>
              {searchQuery ? "No calls match your search query." : "Your past voice and video call logs will appear here."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {calls.map((call) => (
              <motion.div
                key={call.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 18px",
                  backgroundColor: "rgba(16, 18, 24, 0.7)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 16,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <img
                    src={call.partner?.avatar || "https://ui-avatars.com/api/?name=User"}
                    alt={call.partner?.name || "User"}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: "0.98rem", fontWeight: 700, color: "#ffffff" }}>
                      {call.partner?.name || "DOST User"}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem", color: "#94a3b8" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        {renderDirectionIcon(call.direction)}
                        <span
                          style={{
                            fontWeight: 600,
                            color: call.direction === "MISSED" ? "#ef4444" : "#cbd5e1",
                          }}
                        >
                          {call.direction}
                        </span>
                      </span>
                      <span>•</span>
                      <span>{formatCallDate(call.createdAt)}</span>
                      {call.duration > 0 && (
                        <>
                          <span>•</span>
                          <span>{formatCallDuration(call.duration)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Redial Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() =>
                      call.partner?.id &&
                      startCall({ id: call.partner.id, name: call.partner.name, avatar: call.partner.avatar }, "VOICE")
                    }
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      backgroundColor: "rgba(0, 242, 254, 0.12)",
                      border: "1px solid rgba(0, 242, 254, 0.3)",
                      color: "#00f2fe",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    title="Call Back (Voice)"
                  >
                    <Phone size={14} />
                    <span>Call</span>
                  </button>

                  <button
                    onClick={() =>
                      call.partner?.id &&
                      startCall({ id: call.partner.id, name: call.partner.name, avatar: call.partner.avatar }, "VIDEO")
                    }
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      backgroundColor: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                      color: "#10b981",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    title="Call Back (Video)"
                  >
                    <Video size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
