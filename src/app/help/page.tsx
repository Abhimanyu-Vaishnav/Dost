"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle, ChevronDown, MessageSquare, ShieldCheck, User, KeyRound, Bug, Send, CheckCircle2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactSubject, setContactSubject] = useState("");
  const [contactMessage, setContactMessage] = useState("");

  const faqs = [
    {
      q: "How does the live feed auto-refresh work?",
      a: "DOST automatically polls for fresh posts in the background every 3 seconds. To protect your reading flow from annoying content shifts, new posts are silently queued into the top 'Show N posts' bar. Clicking the bar smoothly reveals the posts."
    },
    {
      q: "How do I verify my DOST profile?",
      a: "You can request profile verification by navigating to your Profile settings or upgrading to DOST Premium. Verified profiles receive the blue verification badge and boosted reach on the algorithmic For You feed."
    },
    {
      q: "Is direct messaging end-to-end secure?",
      a: "Yes! Direct messages and audio/video calls are transmitted securely using HTTPS/SSL and WebRTC protocols. Conversations can only be viewed by the participating users."
    },
    {
      q: "How do code blocks work in posts?",
      a: "When creating a post, click the Code (<>) icon. Any code snippet you paste will be automatically formatted with syntax highlighting, line numbers, and developer-friendly monospace typography."
    },
    {
      q: "How can I report inappropriate content or spam?",
      a: "Click the three dots (...) icon on any post or comment and select 'Hide/Report'. Our AI moderation system and safety team review reports promptly."
    }
  ];

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactMessage.trim()) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubject("");
      setContactMessage("");
      setContactSubmitted(false);
    }, 4000);
  };

  return (
    <AppLayout>
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "24px 20px 80px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
          <Link 
            href="/feed" 
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center",
              width: "38px", height: "38px", borderRadius: "50%",
              background: "var(--color-bg-hover)", color: "var(--color-text-main)",
              transition: "background 0.2s"
            }}
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--color-text-main)", margin: 0 }}>
              Help Center & Support
            </h1>
            <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Find answers, FAQs, and get in touch with DOST support
            </span>
          </div>
        </div>

        {/* Hero Search Box */}
        <div style={{
          background: "linear-gradient(135deg, rgba(29, 155, 240, 0.12), rgba(0, 198, 255, 0.05))",
          border: "1px solid rgba(29, 155, 240, 0.3)",
          borderRadius: "20px",
          padding: "28px 24px",
          marginBottom: "36px",
          textAlign: "center"
        }}>
          <HelpCircle size={36} style={{ color: "var(--color-primary)", marginBottom: "8px" }} />
          <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 6px" }}>
            How can we help you today?
          </h2>
          <p style={{ fontSize: "0.95rem", color: "var(--color-text-muted)", margin: 0 }}>
            Browse our Frequently Asked Questions or submit a support ticket below.
          </p>
        </div>

        {/* FAQ Accordion */}
        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "16px" }}>
          Frequently Asked Questions
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div 
                key={i} 
                style={{
                  background: "var(--color-bg-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "16px",
                  overflow: "hidden"
                }}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  style={{
                    width: "100%", padding: "18px 20px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "none", border: "none", color: "var(--color-text-main)",
                    fontSize: "1rem", fontWeight: 700, textAlign: "left", cursor: "pointer"
                  }}
                >
                  <span>{faq.q}</span>
                  <ChevronDown 
                    size={20} 
                    style={{ 
                      transform: isOpen ? "rotate(180deg)" : "rotate(0)", 
                      transition: "transform 0.2s", color: "var(--color-primary)", flexShrink: 0 
                    }} 
                  />
                </button>

                {isOpen && (
                  <div style={{
                    padding: "0 20px 18px",
                    color: "var(--color-text-muted)",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    borderTop: "1px solid var(--color-border)"
                  }}>
                    <p style={{ margin: "12px 0 0" }}>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact Support Form */}
        <div style={{
          background: "var(--color-bg-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "20px",
          padding: "28px"
        }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--color-text-main)", margin: "0 0 6px" }}>
            Contact DOST Support
          </h3>
          <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", margin: "0 0 20px" }}>
            Still need help? Send us a message and our support team will reply within 24 hours.
          </p>

          {contactSubmitted ? (
            <div style={{
              background: "rgba(29, 155, 240, 0.1)",
              border: "1px solid var(--color-primary)",
              borderRadius: "14px",
              padding: "20px",
              textAlign: "center",
              color: "var(--color-primary)",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px"
            }}>
              <CheckCircle2 size={24} />
              <span>Thank you! Your ticket has been submitted successfully.</span>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "6px" }}>
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Account issue, bug report, feedback"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px",
                    borderRadius: "12px", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-base)", color: "var(--color-text-main)",
                    fontSize: "0.95rem", outline: "none"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "6px" }}>
                  Message
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your issue or question in detail..."
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  style={{
                    width: "100%", padding: "12px 16px",
                    borderRadius: "12px", border: "1px solid var(--color-border)",
                    background: "var(--color-bg-base)", color: "var(--color-text-main)",
                    fontSize: "0.95rem", outline: "none", resize: "vertical"
                  }}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  background: "var(--color-primary)", color: "#fff",
                  border: "none", borderRadius: "99px", padding: "12px 24px",
                  fontSize: "0.95rem", fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "8px", width: "fit-content"
                }}
              >
                <Send size={18} />
                <span>Submit Support Ticket</span>
              </button>
            </form>
          )}
        </div>

        {/* Policy Quick Links */}
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "32px", fontSize: "0.9rem", fontWeight: 600 }}>
          <Link href="/about" style={{ color: "var(--color-primary)", textDecoration: "none" }}>About DOST</Link>
          <Link href="/privacy" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Privacy Policy</Link>
          <Link href="/terms" style={{ color: "var(--color-primary)", textDecoration: "none" }}>Terms & Conditions</Link>
        </div>

      </div>
    </AppLayout>
  );
}
