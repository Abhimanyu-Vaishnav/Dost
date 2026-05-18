"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSearch} style={{ position: "relative" }}>
      <div style={{
        position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
        color: "var(--color-text-muted)", display: "flex", alignItems: "center"
      }}>
        <Search size={18} />
      </div>
      <input
        type="text"
        placeholder="Search DOST..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%", padding: "12px 16px 12px 44px",
          borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)",
          backgroundColor: "rgba(255,255,255,0.05)", color: "var(--color-text-main)",
          fontSize: "1rem", outline: "none", transition: "all var(--transition-fast)"
        }}
        onFocus={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.1)"}
        onBlur={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.05)"}
      />
    </form>
  );
}
