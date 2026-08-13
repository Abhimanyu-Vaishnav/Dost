"use client";

import { useState } from "react";
import { 
  Zap, Check, Star, ShieldCheck, Sparkles, Flame, 
  Palette, ArrowRight, Loader2, Award 
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useRouter } from "next/navigation";

export default function PremiumPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "gold">("gold");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isUpgraded, setIsUpgraded] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const res = await fetch("/api/premium", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan })
      });
      if (res.ok) {
        setIsUpgraded(true);
        setTimeout(() => {
          router.push("/feed");
        }, 1800);
      }
    } catch (e) {
      console.error("Upgrade error:", e);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <AppLayout>
      <div style={{
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "32px",
        maxWidth: "960px",
        margin: "0 auto",
        width: "100%"
      }}>
        {/* Banner Hero Title */}
        <div style={{ textAlign: "center", maxWidth: "600px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            background: "linear-gradient(135deg, rgba(234, 179, 8, 0.15), rgba(245, 158, 11, 0.15))",
            color: "#f59e0b", padding: "6px 16px", borderRadius: "9999px",
            fontWeight: 800, fontSize: "0.85rem", border: "1px solid rgba(245, 158, 11, 0.3)",
            marginBottom: "16px"
          }}>
            <Star size={16} fill="#f59e0b" /> DOST PREMIUM SUITE
          </div>

          <h1 style={{ fontSize: "2.4rem", fontWeight: 900, color: "var(--color-text-main)", margin: "0 0 12px 0", letterSpacing: "-0.5px" }}>
            Upgrade Your Social Experience
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--color-text-muted)", lineHeight: "1.6", margin: 0 }}>
            Get verified badges, monetization tip payouts, custom themes, and priority AI superpowers.
          </p>
        </div>

        {/* Success Banner */}
        {isUpgraded && (
          <div className="animate-scale-in" style={{
            width: "100%", padding: "16px 24px", borderRadius: "20px",
            background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))",
            border: "1px solid #10b981", color: "#10b981", fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px"
          }}>
            <Award size={24} />
            <span>Success! You are now upgraded to DOST {selectedPlan.toUpperCase()} with Verified Badge! Redirecting...</span>
          </div>
        )}

        {/* 2 Tier Plan Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
          width: "100%"
        }}>
          {/* DOST Pro Card */}
          <div
            onClick={() => setSelectedPlan("pro")}
            style={{
              background: "var(--color-bg-surface)",
              border: selectedPlan === "pro" ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
              borderRadius: "24px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              cursor: "pointer",
              boxShadow: selectedPlan === "pro" ? "0 10px 30px rgba(29, 155, 240, 0.2)" : "none",
              transition: "all 0.2s ease",
              position: "relative"
            }}
          >
            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--color-text-main)" }}>DOST Pro</div>
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "4px" }}>Essential verification & creator tools</div>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--color-text-main)" }}>$8</span>
              <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>/ month</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
              {[
                "Verified Blue Checkmark Badge",
                "1080p Full HD Video Uploads",
                "50 AI Assistant uses per day",
                "Edit Post up to 1 Hour",
                "50% Fewer Ads in Feed"
              ].map((feat, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "var(--color-text-main)", fontWeight: 600 }}>
                  <Check size={16} style={{ color: "var(--color-primary)" }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DOST Premium Gold Card */}
          <div
            onClick={() => setSelectedPlan("gold")}
            style={{
              background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(234, 179, 8, 0.04))",
              border: selectedPlan === "gold" ? "2px solid #f59e0b" : "1px solid rgba(245, 158, 11, 0.3)",
              borderRadius: "24px",
              padding: "28px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              cursor: "pointer",
              boxShadow: selectedPlan === "gold" ? "0 15px 40px rgba(245, 158, 11, 0.25)" : "none",
              transition: "all 0.2s ease",
              position: "relative"
            }}
          >
            {/* Recommended Tag */}
            <div style={{
              position: "absolute", top: "-12px", right: "24px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white", padding: "4px 14px", borderRadius: "99px",
              fontSize: "0.75rem", fontWeight: 900, letterSpacing: "1px"
            }}>
              MOST POPULAR
            </div>

            <div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f59e0b", display: "flex", alignItems: "center", gap: "6px" }}>
                <Star size={20} fill="#f59e0b" /> DOST Gold
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", marginTop: "4px" }}>Ultimate creator monetization & VIP suite</div>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--color-text-main)" }}>$16</span>
              <span style={{ fontSize: "0.9rem", color: "var(--color-text-muted)" }}>/ month</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid rgba(245, 158, 11, 0.2)", paddingTop: "16px" }}>
              {[
                "Gold Star Verified Creator Badge ⭐️",
                "Creator Tipping & Monetization Payouts",
                "4K Ultra HD Shorts & Video Uploads",
                "Unlimited AI Post Assistant & Image Generator",
                "100% Ad-Free Experience",
                "Custom Themes & App Icon Customization"
              ].map((feat, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.9rem", color: "var(--color-text-main)", fontWeight: 700 }}>
                  <Check size={16} style={{ color: "#f59e0b" }} />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upgrade Call-to-Action Button */}
        <button
          onClick={handleUpgrade}
          disabled={isUpgrading || isUpgraded}
          style={{
            padding: "16px 40px",
            borderRadius: "9999px",
            background: selectedPlan === "gold" ? "linear-gradient(135deg, #f59e0b, #d97706)" : "var(--color-primary)",
            color: "white",
            fontWeight: 800,
            fontSize: "1.1rem",
            border: "none",
            cursor: "pointer",
            boxShadow: selectedPlan === "gold" ? "0 10px 30px rgba(245, 158, 11, 0.4)" : "0 10px 30px rgba(29, 155, 240, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            transition: "transform 0.15s ease"
          }}
          className="hover-scale"
        >
          {isUpgrading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span>Activating Upgrade...</span>
            </>
          ) : (
            <>
              <span>Subscribe to DOST {selectedPlan.toUpperCase()}</span>
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </AppLayout>
  );
}
