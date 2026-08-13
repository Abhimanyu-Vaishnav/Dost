"use client";

import { useState, useRef } from "react";
import { ShortCard, ShortItem } from "./ShortCard";

export function ShortsFeedClient({ shorts }: { shorts: ShortItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, clientHeight } = containerRef.current;
      const newIndex = Math.round(scrollTop / clientHeight);
      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex);
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
        backgroundColor: "#000",
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        scrollbarWidth: "none"
      }}
    >
      {shorts.map((short, idx) => (
        <div key={short.id} style={{ width: "100%", height: "100dvh", scrollSnapAlign: "start" }}>
          <ShortCard short={short} isActive={idx === activeIndex} />
        </div>
      ))}
    </div>
  );
}
