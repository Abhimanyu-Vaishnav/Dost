"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, X } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  searchPlaceholder?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

export function PageHeader({ 
  title, 
  subtitle, 
  showBackButton, 
  searchPlaceholder, 
  searchQuery, 
  onSearchChange 
}: PageHeaderProps) {
  const router = useRouter();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "var(--color-bg-glass)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--color-border)",
      padding: "8px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      minHeight: "58px",
      width: "100%"
    }}>
      {isSearchExpanded && onSearchChange ? (
        <div className="animate-fade-in" style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "2px 0" }}>
          <div style={{
            flex: 1, display: "flex", alignItems: "center", gap: "10px",
            background: "var(--color-bg-surface)", border: "1px solid var(--color-primary)",
            borderRadius: "99px", padding: "8px 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)"
          }}>
            <Search size={17} style={{ color: "var(--color-primary)", flexShrink: 0 }} />
            <input
              type="text"
              autoFocus
              placeholder={searchPlaceholder || "Search posts..."}
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{
                flex: 1, background: "none", border: "none", outline: "none",
                color: "var(--color-text-main)", fontSize: "0.92rem", fontWeight: 600
              }}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange("")}
                style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer", display: "flex" }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setIsSearchExpanded(false);
              onSearchChange("");
            }}
            style={{
              background: "none", border: "none", color: "var(--color-primary)",
              fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", padding: "4px 8px"
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1, minWidth: 0 }}>
            {showBackButton && (
              <button 
                onClick={() => router.back()}
                style={{
                  padding: "8px",
                  borderRadius: "50%",
                  transition: "background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-main)"
                }}
                className="hover-bg"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, lineHeight: 1.2, color: "var(--color-text-main)" }}>{title}</h2>
              {subtitle && <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>{subtitle}</p>}
            </div>
          </div>

          {onSearchChange && (
            <button
              onClick={() => setIsSearchExpanded(true)}
              style={{
                width: "38px", height: "38px", borderRadius: "50%",
                background: "var(--color-bg-surface)", border: "1px solid var(--color-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--color-text-main)", cursor: "pointer", transition: "all 0.2s",
                flexShrink: 0
              }}
              className="hover-bg"
              title="Search User Posts"
            >
              <Search size={18} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
