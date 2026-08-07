'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Sparkles, Layers, Flame, MessageSquare, RefreshCw } from 'lucide-react';
import { XPostItem } from '@/features/posts/types/xPost';
import { XPostCard } from '@/features/posts/components/XPostCard';
import { XThread } from '@/features/posts/components/XThread';

const MOCK_POST_SINGLE_IMAGE: XPostItem = {
  id: 'post-1',
  author: {
    id: 'user-1',
    name: 'Sarah Jenkins',
    username: 'sarah_j',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
    verified: 'blue',
  },
  createdAt: '2h',
  text: 'Just finished building the new physics-based particle animation engine for #NextJS! The spring physics and custom micro-interactions make UI feel alive. What do you think? 🚀✨ @vercel',
  media: [
    {
      id: 'm1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      alt: 'Modern geometric generative abstract UI background',
    },
  ],
  interactions: {
    replies: 142,
    reposts: 89,
    likes: 1240,
    views: 18500,
    bookmarks: 420,
    isLiked: false,
  },
};

const MOCK_POST_MULTI_IMAGE: XPostItem = {
  id: 'post-2',
  author: {
    id: 'user-2',
    name: 'Design Odyssey',
    username: 'designodyssey',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
    verified: 'gold',
  },
  createdAt: '4h',
  text: 'Exploring futuristic UI architecture in 4 minimal snapshots. Swipe through the grid to see the details! 🎨 #Design #UIUX',
  media: [
    {
      id: 'm2-1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'm2-2',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'm2-3',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'm2-4',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    },
  ],
  interactions: {
    replies: 56,
    reposts: 210,
    likes: 3490,
    views: 42100,
    bookmarks: 830,
    isLiked: true,
  },
};

const MOCK_POST_VIDEO: XPostItem = {
  id: 'post-3',
  author: {
    id: 'user-3',
    name: 'Tech Insider',
    username: 'techinsider',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    verified: 'gray',
  },
  createdAt: '6h',
  text: 'Watch this 4K motion graphics breakdown in real-time. Turn audio on for sound design! 🔊 #Tech #Animation',
  media: [
    {
      id: 'v1',
      type: 'video',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      duration: '0:15',
    },
  ],
  interactions: {
    replies: 98,
    reposts: 340,
    likes: 5120,
    views: 89000,
    bookmarks: 1100,
  },
};

const MOCK_POST_POLL: XPostItem = {
  id: 'post-4',
  author: {
    id: 'user-4',
    name: 'Frontend Daily',
    username: 'frontenddaily',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80',
    verified: 'blue',
  },
  createdAt: '1h',
  text: 'Which state management or animation framework do you prefer for high-performance React web apps in 2026? Vote below 👇',
  poll: {
    id: 'poll-1',
    options: [
      { id: 'opt-1', text: 'Framer Motion & Zustand', votes: 1420 },
      { id: 'opt-2', text: 'GSAP & Redux Toolkit', votes: 680 },
      { id: 'opt-3', text: 'Tailwind CSS & Signals', votes: 310 },
      { id: 'opt-4', text: 'Vanilla React Hooks', votes: 530 },
    ],
    totalVotes: 2940,
    expiresAt: '8 hours left',
  },
  interactions: {
    replies: 310,
    reposts: 145,
    likes: 2190,
    views: 34000,
    bookmarks: 560,
  },
};

const MOCK_POST_QUOTE: XPostItem = {
  id: 'post-5',
  author: {
    id: 'user-5',
    name: 'Marcus Vance',
    username: 'mvance_dev',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80',
    verified: 'blue',
  },
  createdAt: '3h',
  text: '100% agreed! Beautiful micro-animations transform good software into unforgettable experiences.',
  quotePost: {
    id: 'quote-1',
    author: {
      id: 'q-author',
      name: 'Guillermo Rauch',
      username: 'rauchg',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      verified: 'black' as any,
    },
    createdAt: '5h',
    text: 'Speed is essential, but delight is magic. The best products respond instantly with tactile visual feedback.',
  },
  interactions: {
    replies: 48,
    reposts: 180,
    likes: 1890,
    views: 23000,
    bookmarks: 390,
  },
};

const MOCK_POST_REPLY: XPostItem = {
  id: 'post-reply-1',
  author: {
    id: 'user-ramiro',
    name: 'Ramiro Haag',
    username: 'ramiro_h',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    verified: 'blue',
  },
  createdAt: '12:41 AM',
  text: 'Test reply post! Loved your latest breakdown on full-stack architecture.',
  replyToName: 'Abhimanyu',
  replyToUsername: 'abhimanyu',
  interactions: {
    replies: 12,
    reposts: 4,
    likes: 67,
    views: 890,
    bookmarks: 8,
  },
};

const MOCK_THREAD_LEADER: XPostItem = {
  id: 'thread-main',
  author: {
    id: 'thread-author',
    name: 'Elena Rostova',
    username: 'elena_code',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
    verified: 'gold',
  },
  createdAt: '12m',
  text: '🧵 THREAD: How we optimized our real-time social feed to render 60fps animations with 0 layout shifts. Here is the breakdown 👇',
  media: [
    {
      id: 'tm-1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    },
  ],
  interactions: {
    replies: 28,
    reposts: 112,
    likes: 890,
    views: 14500,
    bookmarks: 430,
  },
  replies: [
    {
      id: 'reply-1',
      author: {
        id: 'reply-u1',
        name: 'David Chen',
        username: 'dchen',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
        verified: 'blue',
      },
      createdAt: '10m',
      text: '1/4 First, using Framer Motion layoutId with GPU hardware acceleration prevented unnecessary browser reflows during list updates.',
      replyToUsername: 'elena_code',
      interactions: { replies: 5, reposts: 12, likes: 210, views: 3400, bookmarks: 45 },
    },
    {
      id: 'reply-2',
      author: {
        id: 'reply-u2',
        name: 'Elena Rostova',
        username: 'elena_code',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80',
        verified: 'gold',
      },
      createdAt: '8m',
      text: '2/4 Second, particle effects are rendered in absolute coordinate spaces using non-blocking micro-task cycles.',
      replyToUsername: 'elena_code',
      interactions: { replies: 8, reposts: 34, likes: 450, views: 5600, bookmarks: 98 },
    },
    {
      id: 'reply-3',
      author: {
        id: 'reply-u3',
        name: 'Sophia Williams',
        username: 'sophia_w',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
        verified: 'blue',
      },
      createdAt: '5m',
      text: 'This is brilliant! Double-tapping to trigger the floating particle burst feels super responsive on mobile too.',
      replyToUsername: 'elena_code',
      interactions: { replies: 2, reposts: 4, likes: 88, views: 1200, bookmarks: 12 },
    },
  ],
};

export default function XPostShowcasePage() {
  const [theme, setTheme] = useState<'dark' | 'dim' | 'light'>('dark');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const getThemeBg = () => {
    if (theme === 'dim') return 'bg-[#15202b] text-[#f7f9f9]';
    if (theme === 'light') return 'bg-[#ffffff] text-[#0f1419]';
    return 'bg-[#000000] text-[#e7e9ea]';
  };

  return (
    <div
      data-theme={theme}
      className={`min-h-screen ${getThemeBg()} transition-colors duration-300 font-sans pb-20`}
    >
      {/* Sticky Glass Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#000000]/80 dark:bg-[#000000]/80 border-b border-[#2f3336] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-7 h-7 fill-current text-[#1d9bf0]">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <div>
              <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
                X Post & Animation System
                <span className="bg-[#1d9bf0]/20 text-[#1d9bf0] text-xs font-semibold px-2 py-0.5 rounded-full">
                  Pixel-Perfect
                </span>
              </h1>
              <p className="text-xs text-[#71767b]">
                Double-tap to like • Particle Physics • Live Threads & Media Grids
              </p>
            </div>
          </div>

          {/* Theme Selector Controls */}
          <div className="flex items-center gap-1.5 bg-[#16181c] border border-[#2f3336] rounded-full p-1">
            <button
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                theme === 'dark' ? 'bg-[#1d9bf0] text-white shadow-md' : 'text-[#71767b] hover:text-white'
              }`}
              title="Lights Out (Pitch Black)"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dim')}
              className={`p-2 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                theme === 'dim' ? 'bg-[#1d9bf0] text-white shadow-md' : 'text-[#71767b] hover:text-white'
              }`}
              title="Dim (Navy Dark)"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`p-2 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                theme === 'light' ? 'bg-[#1d9bf0] text-white shadow-md' : 'text-[#71767b] hover:text-white'
              }`}
              title="Light Mode"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto border-x border-[#2f3336] min-h-[calc(100vh-60px)]">
        {/* Instruction Banner */}
        <div className="p-4 border-b border-[#2f3336] bg-[#16181c]/40 text-xs text-[#71767b] space-y-1.5">
          <div className="flex items-center gap-2 text-[#1d9bf0] font-bold text-sm">
            <Flame className="w-4 h-4 fill-current" />
            <span>Interactive Micro-Interactions Guide</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px] pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#f91880]" />
              <span><strong>Double-Tap:</strong> Giant center heart burst</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00ba7c]" />
              <span><strong>Repost:</strong> Rotating arrows + toast</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ffd700]" />
              <span><strong>Bookmark:</strong> Gold particle explosion</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1d9bf0]" />
              <span><strong>Reply:</strong> Slide-up composer + thread line</span>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex border-b border-[#2f3336] overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Showcase' },
            { id: 'thread', label: 'Live Thread' },
            { id: 'grid', label: '4-Image Grid' },
            { id: 'video', label: 'Video Player' },
            { id: 'poll', label: 'Interactive Poll' },
            { id: 'quote', label: 'Quote Post' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-3 font-semibold text-sm whitespace-nowrap transition-colors relative flex-1 text-center ${
                activeFilter === tab.id ? 'text-[#e7e9ea]' : 'text-[#71767b] hover:text-[#e7e9ea]'
              }`}
            >
              {tab.label}
              {activeFilter === tab.id && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute bottom-0 inset-x-4 h-1 bg-[#1d9bf0] rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Dynamic Showcase Content */}
        <div className="divide-y divide-[#2f3336]">
          {(activeFilter === 'all' || activeFilter === 'thread') && (
            <div className="py-2 bg-[#000000]">
              <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#1d9bf0]">
                Continuous Thread & Inline Replies
              </div>
              <XThread mainPost={MOCK_THREAD_LEADER} />
            </div>
          )}

          {(activeFilter === 'all' || activeFilter === 'grid') && (
            <div>
              <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-[#1d9bf0]">
                4-Image Aspect Grid Layout
              </div>
              <XPostCard post={MOCK_POST_MULTI_IMAGE} />
            </div>
          )}

          {(activeFilter === 'all' || activeFilter === 'video') && (
            <div>
              <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-[#1d9bf0]">
                Interactive Video Player Post
              </div>
              <XPostCard post={MOCK_POST_VIDEO} />
            </div>
          )}

          {(activeFilter === 'all' || activeFilter === 'poll') && (
            <div>
              <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-[#1d9bf0]">
                Interactive Voting Poll
              </div>
              <XPostCard post={MOCK_POST_POLL} />
            </div>
          )}

          {(activeFilter === 'all' || activeFilter === 'quote') && (
            <div>
              <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-[#1d9bf0]">
                Nested Quote Post Card
              </div>
              <XPostCard post={MOCK_POST_QUOTE} />
            </div>
          )}

          {activeFilter === 'all' && (
            <div>
              <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-[#1d9bf0]">
                Feed Reply Indicator (&quot;Ramiro Haag replied to Abhimanyu&apos;s Post&quot;)
              </div>
              <XPostCard post={MOCK_POST_REPLY} />
            </div>
          )}

          {activeFilter === 'all' && (
            <div>
              <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider text-[#1d9bf0]">
                Single Media Post with Micro-Interactions
              </div>
              <XPostCard post={MOCK_POST_SINGLE_IMAGE} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
