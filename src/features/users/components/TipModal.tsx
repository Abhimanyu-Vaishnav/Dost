"use client";

import { useState } from "react";
import { X, DollarSign, Heart, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

interface TipModalProps {
  recipientName: string;
  recipientId: string;
  onClose: () => void;
}

export function TipModal({ recipientName, recipientId, onClose }: TipModalProps) {
  const [amount, setAmount] = useState<number>(5);
  const [customMsg, setCustomMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const handleSendTip = async () => {
    setIsSending(true);
    try {
      const res = await fetch("/api/tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, amount, message: customMsg })
      });
      if (res.ok) {
        setSuccessToast(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)",
      zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px"
    }}>
      <div className="glass animate-scale-in" style={{
        width: "100%", maxWidth: "440px",
        backgroundColor: "var(--color-bg-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "24px", padding: "24px",
        display: "flex", flexDirection: "column", gap: "18px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981, #059669)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "white"
            }}>
              <DollarSign size={20} />
            </div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--color-text-main)" }}>
              Support {recipientName}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {successToast ? (
          <div style={{ padding: "30px 10px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <CheckCircle2 size={48} style={{ color: "#10b981" }} />
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "var(--color-text-main)" }}>Tip Sent!</span>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem" }}>Thank you for supporting creators on DOST!</p>
          </div>
        ) : (
          <>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.9rem", lineHeight: 1.4 }}>
              Show your appreciation to {recipientName}. 100% of your tip goes directly to the creator.
            </p>

            {/* Quick Amount Buttons */}
            <div style={{ display: "flex", gap: "10px" }}>
              {[2, 5, 10, 25].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmount(val)}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: "14px",
                    border: amount === val ? "2px solid #10b981" : "1px solid var(--color-border)",
                    background: amount === val ? "rgba(16, 185, 129, 0.1)" : "var(--color-bg-base)",
                    color: amount === val ? "#10b981" : "var(--color-text-main)",
                    fontWeight: 800, fontSize: "1rem", cursor: "pointer"
                  }}
                >
                  ${val}
                </button>
              ))}
            </div>

            {/* Custom Message */}
            <textarea
              rows={2}
              placeholder="Add a nice message (optional)..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "14px",
                border: "1px solid var(--color-border)", background: "var(--color-bg-base)",
                color: "var(--color-text-main)", fontSize: "0.9rem", resize: "none", outline: "none"
              }}
            />

            {/* Send Tip Button */}
            <button
              onClick={handleSendTip}
              disabled={isSending}
              style={{
                width: "100%", padding: "14px 0", borderRadius: "99px",
                background: "#10b981", color: "white", fontWeight: 800,
                fontSize: "1rem", border: "none", cursor: "pointer",
                boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3)"
              }}
            >
              {isSending ? "Processing..." : `Send $${amount} Tip`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
