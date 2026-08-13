"use client";

import { useState, useRef } from "react";
import { ShortCard, ShortItem } from "./ShortCard";
import styles from "./ShortsFeedClient.module.css";

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
      className={styles.shortsContainer}
    >
      {displayedShorts.map((short, idx) => (
        <div key={`${short.id}-${idx}`} className={styles.shortSlide}>
          <div className={styles.videoCard}>
            <ShortCard short={short} isActive={idx === activeIndex} />
          </div>
        </div>
      ))}
    </div>
  );
}
