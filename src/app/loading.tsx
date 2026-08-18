import React from "react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function GlobalLoading() {
  return (
    <AppLayout>
      <div style={{ width: "100%", position: "relative" }}>
        {/* Top glowing cyan progress loading bar */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "3px",
          background: "linear-gradient(90deg, #00f2fe, #7b2cbf, #00f2fe)",
          backgroundSize: "200% 100%",
          animation: "loadingBar 1.2s infinite linear",
          zIndex: 99999
        }} />

        {/* Instant Skeleton Feed Loading Shell */}
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "630px", margin: "0 auto" }}>
          {[1, 2, 3].map((n) => (
            <div 
              key={n}
              style={{
                background: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "20px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                opacity: 0.8
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--color-border)", animation: "pulse 1.5s infinite" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ width: "130px", height: "14px", borderRadius: "6px", background: "var(--color-border)", animation: "pulse 1.5s infinite" }} />
                  <div style={{ width: "80px", height: "10px", borderRadius: "4px", background: "var(--color-border)", animation: "pulse 1.5s infinite" }} />
                </div>
              </div>

              <div style={{ width: "100%", height: "14px", borderRadius: "6px", background: "var(--color-border)", animation: "pulse 1.5s infinite" }} />
              <div style={{ width: "75%", height: "14px", borderRadius: "6px", background: "var(--color-border)", animation: "pulse 1.5s infinite" }} />
              <div style={{ width: "100%", height: "180px", borderRadius: "16px", background: "var(--color-border)", animation: "pulse 1.5s infinite" }} />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes loadingBar {
          0% { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </AppLayout>
  );
}
