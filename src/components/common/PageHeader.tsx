"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
}

export function PageHeader({ title, subtitle, showBackButton }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div style={{
      position: "sticky",
      top: 0,
      zIndex: 10,
      background: "var(--color-bg-glass)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid var(--color-border)",
      padding: "0 16px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      height: "53px", // Standard X header height
      width: "100%"
    }}>
      {showBackButton && (
        <button 
          onClick={() => router.back()}
          style={{
            padding: "8px",
            borderRadius: "50%",
            transition: "background 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          className="hover-bg"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: 0, lineHeight: 1.2 }}>{title}</h2>
        {subtitle && <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>{subtitle}</p>}
      </div>
    </div>
  );
}
