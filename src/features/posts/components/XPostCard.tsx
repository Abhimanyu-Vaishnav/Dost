'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BadgeCheck, MoreHorizontal, Heart, Bookmark, Repeat2, Share2, VolumeX, EyeOff, MessageCircle } from 'lucide-react';
import { XPostItem } from '../types/xPost';
import { XInteractionBar } from './XInteractionBar';
import { XMediaGrid } from './XMediaGrid';
import { XPollCard } from './XPollCard';
import { XQuotePostCard } from './XQuotePostCard';

interface XPostCardProps {
  post: XPostItem;
  hasTopThreadLine?: boolean;
  hasBottomThreadLine?: boolean;
  onPostClick?: (post: XPostItem) => void;
  onReplyClick?: (post: XPostItem) => void;
  onQuoteClick?: (post: XPostItem) => void;
}

export const XPostCard: React.FC<XPostCardProps> = ({
  post,
  hasTopThreadLine = false,
  hasBottomThreadLine = false,
  onPostClick,
  onReplyClick,
  onQuoteClick,
}) => {
  const [showCenterHeart, setShowCenterHeart] = useState(false);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);

  // Parse text for hashtags, mentions, links
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\s+)/);
    return parts.map((part, idx) => {
      if (part.startsWith('#') && part.length > 1) {
        return (
          <span
            key={idx}
            className="text-[#1d9bf0] hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              alert(`Search hashtag: ${part}`);
            }}
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('@') && part.length > 1) {
        return (
          <span
            key={idx}
            className="text-[#1d9bf0] hover:underline cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              alert(`View profile: ${part}`);
            }}
          >
            {part}
          </span>
        );
      }
      if (part.startsWith('http://') || part.startsWith('https://')) {
        return (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noreferrer"
            className="text-[#1d9bf0] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  // Double tap to like handling
  const handleCardClick = (e: React.MouseEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Trigger center heart pop
      setShowCenterHeart(true);
      setTimeout(() => setShowCenterHeart(false), 900);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      if (onPostClick) {
        onPostClick(post);
      }
    }
  };

  // Long press mobile action sheet handling
  const handleTouchStart = () => {
    touchTimerRef.current = setTimeout(() => {
      setShowActionSheet(true);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full border-b border-[#2f3336] bg-[#000000] hover:bg-[#16181c]/40 transition-colors cursor-pointer select-none px-4 py-3"
    >
      {/* Big Center Floating Heart for Double Tap */}
      <AnimatePresence>
        {showCenterHeart && (
          <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ scale: 0.2, opacity: 0, rotate: -15 }}
              animate={{ scale: [0.2, 1.4, 1], opacity: [0, 1, 0], rotate: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] }}
              className="text-[#f91880] drop-shadow-[0_10px_25px_rgba(249,24,128,0.6)]"
            >
              <Heart className="w-28 h-28 fill-current" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        {/* Left Avatar & Vertical Thread Line */}
        <div className="flex flex-col items-center shrink-0 relative">
          {/* Top Thread Line Connector */}
          {hasTopThreadLine && (
            <div className="w-0.5 bg-[#333639] absolute -top-3 h-3 left-1/2 -translate-x-1/2" />
          )}

          <div className="relative group">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-10 h-10 rounded-full object-cover group-hover:opacity-90 transition-opacity"
            />
          </div>

          {/* Bottom Continuous Thread Line Connector */}
          {hasBottomThreadLine && (
            <div className="w-0.5 bg-[#333639] flex-1 mt-2 min-h-[20px]" />
          )}
        </div>

        {/* Right Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span className="font-bold text-[#e7e9ea] text-[15px] hover:underline truncate">
                {post.author.name}
              </span>

              {post.author.verified === 'blue' && (
                <BadgeCheck className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0]/20 shrink-0" />
              )}
              {post.author.verified === 'gold' && (
                <BadgeCheck className="w-4 h-4 text-[#eab308] fill-[#eab308]/20 shrink-0" />
              )}
              {post.author.verified === 'gray' && (
                <BadgeCheck className="w-4 h-4 text-[#8b98a5] fill-[#8b98a5]/20 shrink-0" />
              )}

              <span className="text-[#71767b] text-[14px] truncate">
                @{post.author.username}
              </span>
              <span className="text-[#71767b] text-[14px]">·</span>
              <span className="text-[#71767b] text-[14px] hover:underline shrink-0">
                {post.createdAt}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowActionSheet(true);
              }}
              className="text-[#71767b] hover:text-[#1d9bf0] hover:bg-[#1d9bf0]/10 p-1.5 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {/* Reply Context if applicable */}
          {(post.replyToUsername || post.replyToName) && (
            <div className="text-[13px] text-[#71767b] mb-1 font-medium">
              Replying to <span className="text-[#1d9bf0] font-semibold hover:underline">@{post.replyToUsername || post.replyToName}&apos;s Post</span>
            </div>
          )}

          {/* Post Content Text */}
          <p className="text-[#e7e9ea] text-[15px] leading-normal whitespace-pre-wrap break-words mt-1">
            {renderFormattedText(post.text)}
          </p>

          {/* Media Grid (Images / Video / GIF) */}
          {post.media && <XMediaGrid media={post.media} />}

          {/* Poll Card */}
          {post.poll && <XPollCard poll={post.poll} />}

          {/* Quote Post Card */}
          {post.quotePost && <XQuotePostCard quote={post.quotePost} />}

          {/* Bottom Interaction Bar */}
          <div className="mt-2">
            <XInteractionBar
              postId={post.id}
              interactions={post.interactions}
              onReplyClick={() => onReplyClick && onReplyClick(post)}
              onQuoteClick={() => onQuoteClick && onQuoteClick(post)}
            />
          </div>
        </div>
      </div>

      {/* Mobile Long Press Action Sheet Modal */}
      <AnimatePresence>
        {showActionSheet && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => {
              e.stopPropagation();
              setShowActionSheet(false);
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:max-w-md bg-[#000000] border border-[#2f3336] rounded-t-3xl sm:rounded-3xl p-4 space-y-1 shadow-2xl"
            >
              <div className="w-12 h-1 bg-[#2f3336] rounded-full mx-auto mb-3 sm:hidden" />
              <button
                onClick={() => {
                  setShowActionSheet(false);
                  alert('Added to Bookmarks');
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-[#16181c] rounded-2xl text-left font-semibold text-sm text-[#e7e9ea]"
              >
                <Bookmark className="w-5 h-5 text-[#ffd700]" />
                <span>Bookmark post</span>
              </button>
              <button
                onClick={() => {
                  setShowActionSheet(false);
                  alert('Muted @' + post.author.username);
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-[#16181c] rounded-2xl text-left font-semibold text-sm text-[#e7e9ea]"
              >
                <VolumeX className="w-5 h-5 text-[#71767b]" />
                <span>Mute @{post.author.username}</span>
              </button>
              <button
                onClick={() => {
                  setShowActionSheet(false);
                  alert('Not interested in this post');
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-[#16181c] rounded-2xl text-left font-semibold text-sm text-[#e7e9ea]"
              >
                <EyeOff className="w-5 h-5 text-[#71767b]" />
                <span>Not interested in this</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
