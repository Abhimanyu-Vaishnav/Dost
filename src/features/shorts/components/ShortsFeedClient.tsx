"use client";

import { useState, useRef } from "react";
import { ShortCard, ShortItem } from "./ShortCard";

export function ShortsFeedClient({ shorts }: { shorts: ShortItem[] }) {
  const [displayedShorts, setDisplayedShorts] = useState<ShortItem[]>(shorts.slice(0, 15));
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load more videos when approaching bottom of list
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight, scrollHeight } = containerRef.current;
    
    // Active video index calculation
    const newIndex = Math.round(scrollTop / clientHeight);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }

    // Infinite scroll load trigger
    if (scrollTop + clientHeight >= scrollHeight - clientHeight * 3) {
      if (displayedShorts.length < shorts.length) {
        const nextBatch = shorts.slice(displayedShorts.length, displayedShorts.length + 15);
        setDisplayedShorts(prev => [...prev, ...nextBatch]);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        width: "100%",
        height: "100dvh",
        backgroundColor: "#05050a",
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        scrollbarWidth: "none"
      }}
    >
      {displayedShorts.map((short, idx) => (
        <div 
          key={`${short.id}-${idx}`} 
          style={{
            width: "100%",
            height: "100dvh",
            scrollSnapAlign: "start",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 0",
            boxSizing: "border-box"
          }}
        >
          {/* Centered Desktop Video Container with Mobile Aspect Ratio */}
          <div style={{
            width: "100%",
            maxWidth: "430px",
            height: "calc(100dvh - 28px)",
            maxHeight: "860px",
            borderRadius: "24px",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.8)",
            border: "1px solid var(--color-border)",
            backgroundColor: "#000"
          }}>
            <ShortCard short={short} isActive={idx === activeIndex} />
          </div>
        </div>
      ))}
    </div>
  );
}
