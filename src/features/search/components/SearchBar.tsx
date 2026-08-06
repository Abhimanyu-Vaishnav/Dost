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
    <form onSubmit={handleSearch} style={{ position: "relative", width: "100%" }}>
      <div style={{
        position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)",
        color: "var(--color-text-muted)", display: "flex", alignItems: "center"
      }}>
        <Search size={17} />
      </div>
      <input
        type="text"
        placeholder="Search DOST..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%", padding: "10px 16px 10px 44px",
          borderRadius: "9999px", border: "1px solid transparent",
          backgroundColor: "var(--color-bg-surface)", color: "var(--color-text-main)",
          fontSize: "0.95rem", outline: "none", transition: "all 0.15s ease"
        }}
        onFocus={(e) => {
          e.target.style.backgroundColor = "var(--color-bg-base)";
          e.target.style.borderColor = "var(--color-primary)";
        }}
        onBlur={(e) => {
          e.target.style.backgroundColor = "var(--color-bg-surface)";
          e.target.style.borderColor = "transparent";
        }}
      />
    </form>
  );
}

