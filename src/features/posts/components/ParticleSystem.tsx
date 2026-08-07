'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ParticleType = 'like' | 'unlike' | 'repost' | 'bookmark' | 'reply' | 'share';

export interface Particle {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  targetX: number;
  targetY: number;
  color: string;
  shape: 'heart' | 'circle' | 'star' | 'repost' | 'bubble';
}

interface ParticleSystemProps {
  particles: Particle[];
  type: ParticleType;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({ particles }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              opacity: 1,
              scale: 0.2,
              x: p.x,
              y: p.y,
              rotate: 0,
            }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0.2, 1.2, 0.6],
              x: p.targetX,
              y: p.targetY,
              rotate: p.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.85,
              ease: [0.23, 1, 0.32, 1],
            }}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              color: p.color,
            }}
          >
            {p.shape === 'heart' && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-md">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            )}

            {p.shape === 'star' && (
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-md">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            )}

            {p.shape === 'repost' && (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-full h-full drop-shadow-md">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M4.5 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3-3m-3 3l3 3m12-3l-3-3m3 3l-3 3" />
              </svg>
            )}

            {p.shape === 'bubble' && (
              <div
                className="w-full h-full rounded-full drop-shadow-sm"
                style={{ backgroundColor: p.color, opacity: 0.85 }}
              />
            )}

            {p.shape === 'circle' && (
              <div
                className="w-full h-full rounded-full"
                style={{ border: `2px solid ${p.color}`, opacity: 0.7 }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export const createParticleBurst = (
  type: ParticleType,
  originX: number,
  originY: number,
  count = 12
): Particle[] => {
  const newParticles: Particle[] = [];

  const configMap: Record<
    ParticleType,
    { colors: string[]; shapes: ('heart' | 'circle' | 'star' | 'repost' | 'bubble')[] }
  > = {
    like: {
      colors: ['#f91880', '#e0245e', '#ff69b4', '#ff1493', '#ff85c0'],
      shapes: ['heart', 'bubble', 'star'],
    },
    unlike: {
      colors: ['#71767b', '#536471', '#8b98a5'],
      shapes: ['bubble', 'circle'],
    },
    repost: {
      colors: ['#00ba7c', '#00d68f', '#25d366', '#70e000'],
      shapes: ['repost', 'bubble', 'star'],
    },
    bookmark: {
      colors: ['#ffd700', '#ffb700', '#f59e0b', '#fbbf24'],
      shapes: ['star', 'bubble'],
    },
    reply: {
      colors: ['#1d9bf0', '#38bdf8', '#60a5fa', '#93c5fd'],
      shapes: ['bubble', 'circle'],
    },
    share: {
      colors: ['#a855f7', '#c084fc', '#e879f9', '#1d9bf0'],
      shapes: ['star', 'bubble'],
    },
  };

  const config = configMap[type] || configMap.like;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.4 - 0.2);
    const distance = 40 + Math.random() * 55;
    const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
    const color = config.colors[Math.floor(Math.random() * config.colors.length)];

    newParticles.push({
      id: `${type}-${Date.now()}-${i}-${Math.random()}`,
      x: originX,
      y: originY,
      size: type === 'like' ? 14 + Math.random() * 12 : 10 + Math.random() * 10,
      rotation: (Math.random() - 0.5) * 90,
      targetX: originX + Math.cos(angle) * distance,
      targetY: originY + Math.sin(angle) * distance - (type === 'like' || type === 'bookmark' ? 25 : 0), // Float up bias
      color,
      shape,
    });
  }

  return newParticles;
};
