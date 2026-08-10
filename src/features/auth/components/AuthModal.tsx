"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Lock, User, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

interface AuthModalProps {
  onClose: () => void;
  initialMode?: "login" | "register";
}

export function AuthModal({ onClose, initialMode = "login" }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [step, setStep] = useState(1); // For register wizard
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNext = () => {
    if (mode === "register" && step === 1 && email && password.length >= 6) {
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login" ? { email, password } : { email, password, name };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        throw new Error(`Server returned non-JSON response (${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || "Authentication failed");

      router.push("/feed");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      if (mode === "register") setStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(24px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 2000, padding: "20px"
    }} onClick={onClose}>
      <div className="animate-scale-in" style={{
        width: "100%", maxWidth: "420px", background: "rgba(255, 255, 255, 0.85)",
        borderRadius: "32px", border: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)", overflowY: "auto",
        maxHeight: "calc(100vh - 40px)",
        position: "relative"
      }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: "32px 32px 10px", textAlign: "center" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "#666", cursor: "pointer" }}>
            <X size={20} />
          </button>
          <div style={{ 
            width: "56px", height: "56px", background: "var(--color-primary)", 
            borderRadius: "16px", display: "flex", alignItems: "center", 
            justifyContent: "center", color: "white", margin: "0 auto 20px" 
          }}>
            <ShieldCheck size={32} />
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: "8px" }}>
            {mode === "login" ? "Welcome Back" : step === 1 ? "Create Account" : "Final Step"}
          </h2>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>
            {mode === "login" ? "Enter your details to continue" : step === 1 ? "Start your journey with DOST" : "Tell us your name"}
          </p>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{ padding: "24px 32px 40px" }}>
          {error && (
            <div style={{ 
              padding: "12px", background: "#fff1f1", color: "#ff4d4d", 
              borderRadius: "12px", fontSize: "0.85rem", marginBottom: "20px",
              border: "1px solid #ffebeb", textAlign: "center"
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {mode === "register" && step === 2 ? (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ position: "relative" }}>
                  <User size={18} style={{ position: "absolute", left: 16, top: 16, color: "#999" }} />
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    style={{
                      width: "100%", padding: "16px 16px 16px 48px", borderRadius: "16px",
                      border: "1px solid #ddd", background: "white", outline: "none", fontSize: "1rem"
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ position: "relative" }}>
                  <Mail size={18} style={{ position: "absolute", left: 16, top: 16, color: "#999" }} />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{
                      width: "100%", padding: "16px 16px 16px 48px", borderRadius: "16px",
                      border: "1px solid #ddd", background: "white", outline: "none", fontSize: "1rem"
                    }}
                  />
                </div>
                <div style={{ position: "relative" }}>
                  <Lock size={18} style={{ position: "absolute", left: 16, top: 16, color: "#999" }} />
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{
                      width: "100%", padding: "16px 16px 16px 48px", borderRadius: "16px",
                      border: "1px solid #ddd", background: "white", outline: "none", fontSize: "1rem"
                    }}
                  />
                </div>
              </div>
            )}

            {mode === "register" && step === 1 ? (
              <button 
                type="button" 
                onClick={handleNext}
                disabled={!email || password.length < 6}
                style={{
                  width: "100%", padding: "16px", borderRadius: "16px",
                  background: "var(--color-primary)", color: "white", fontWeight: 700,
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", 
                  justifyContent: "center", gap: "8px", marginTop: "12px",
                  opacity: (!email || password.length < 6) ? 0.6 : 1
                }}
              >
                Continue <ArrowRight size={18} />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={isLoading}
                style={{
                  width: "100%", padding: "16px", borderRadius: "16px",
                  background: "var(--color-primary)", color: "white", fontWeight: 700,
                  border: "none", cursor: "pointer", display: "flex", alignItems: "center", 
                  justifyContent: "center", gap: "8px", marginTop: "12px"
                }}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            )}
          </div>

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            {mode === "login" ? (
              <p style={{ fontSize: "0.9rem", color: "#666" }}>
                New to DOST? <button type="button" onClick={() => setMode("register")} style={{ color: "var(--color-primary)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Join Now</button>
              </p>
            ) : (
              <p style={{ fontSize: "0.9rem", color: "#666" }}>
                Already have an account? <button type="button" onClick={() => { setMode("login"); setStep(1); }} style={{ color: "var(--color-primary)", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Log In</button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
