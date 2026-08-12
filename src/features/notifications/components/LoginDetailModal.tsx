"use client";

import { X, ShieldAlert, Monitor, MapPin, Globe, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

interface LoginDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: {
    device?: string;
    deviceName?: string;
    browser?: string;
    ipAddress?: string;
    location?: string;
    loginTime?: string;
    timestamp?: string;
    sessionId?: string;
  } | null;
}

export function LoginDetailModal({ isOpen, onClose, details }: LoginDetailModalProps) {
  if (!isOpen || !details) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.2s ease-out"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          backgroundColor: "var(--color-bg-card, #15202b)",
          border: "1px solid var(--color-border, #38444d)",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          color: "var(--color-text-main, #ffffff)",
          display: "flex",
          flexDirection: "column",
          gap: "20px"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ 
              width: "40px", height: "40px", borderRadius: "12px", 
              background: "rgba(239, 68, 68, 0.15)", color: "#ef4444",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>Login Activity Details</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #8899a6)", margin: 0 }}>
                Security log record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted, #8899a6)",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            className="hover-bg-subtle"
          >
            <X size={20} />
          </button>
        </div>

        {/* Details Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", background: "rgba(255, 255, 255, 0.03)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Device */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <Monitor size={18} style={{ color: "var(--color-primary, #1d9bf0)", marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #8899a6)" }}>Device & Browser</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "2px" }}>
                {details.device || `${details.deviceName || "Desktop PC"} — ${details.browser || "Web Browser"}`}
              </div>
            </div>
          </div>

          {/* Location */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <MapPin size={18} style={{ color: "#10b981", marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #8899a6)" }}>Approximate Location</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "2px" }}>
                {details.location || "India (Detected)"}
              </div>
            </div>
          </div>

          {/* IP Address */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <Globe size={18} style={{ color: "#f59e0b", marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #8899a6)" }}>IP Address</div>
              <div style={{ fontSize: "0.95rem", fontFamily: "monospace", fontWeight: 600, marginTop: "2px" }}>
                {details.ipAddress || "127.0.0.1 (Localhost)"}
              </div>
            </div>
          </div>

          {/* Time */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <Clock size={18} style={{ color: "#8b5cf6", marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted, #8899a6)" }}>Login Timestamp</div>
              <div style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: "2px" }}>
                {details.loginTime || (details.timestamp ? new Date(details.timestamp).toLocaleString() : "Recently")}
              </div>
            </div>
          </div>
        </div>

        {/* Security Notice & Action */}
        <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted, #8899a6)", lineHeight: 1.4 }}>
          If this wasn't you, someone else might have accessed your account. Change your password and revoke session access immediately.
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href="/settings"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: "24px",
              background: "var(--color-primary, #1d9bf0)",
              color: "white",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px"
            }}
          >
            Manage Active Sessions <ExternalLink size={16} />
          </Link>
          <button
            onClick={onClose}
            style={{
              padding: "10px 16px",
              borderRadius: "24px",
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "white",
              fontWeight: 600,
              fontSize: "0.9rem",
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
