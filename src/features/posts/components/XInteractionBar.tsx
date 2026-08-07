'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Repeat2,
  Heart,
  BarChart3,
  Bookmark,
  Share,
  Check,
  Quote,
} from 'lucide-react';
import { PostInteractions } from '../types/xPost';
import { createParticleBurst, Particle, ParticleSystem } from './ParticleSystem';

interface XInteractionBarProps {
  postId: string;
  interactions: PostInteractions;
  onReplyClick?: () => void;
  onQuoteClick?: () => void;
  onLikeChange?: (isLiked: boolean, newCount: number) => void;
  onRepostChange?: (isReposted: boolean, newCount: number) => void;
  onBookmarkChange?: (isBookmarked: boolean, newCount: number) => void;
}

export const XInteractionBar: React.FC<XInteractionBarProps> = ({
  interactions: initialInteractions,
  onReplyClick,
  onQuoteClick,
  onLikeChange,
  onRepostChange,
  onBookmarkChange,
}) => {
  const [interactions, setInteractions] = useState(initialInteractions);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleParticleBurst = (type: any, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const newParticles = createParticleBurst(type, x, y, 14);
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
    }, 900);
  };

  const handleLike = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const newLiked = !interactions.isLiked;
    const newCount = interactions.likes + (newLiked ? 1 : -1);

    setInteractions((prev) => ({
      ...prev,
      isLiked: newLiked,
      likes: newCount,
    }));

    if (newLiked) {
      handleParticleBurst('like', e);
    } else {
      handleParticleBurst('unlike', e);
    }

    if (onLikeChange) onLikeChange(newLiked, newCount);
  };

  const handleRepostToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newReposted = !interactions.isReposted;
    const newCount = interactions.reposts + (newReposted ? 1 : -1);

    setInteractions((prev) => ({
      ...prev,
      isReposted: newReposted,
      reposts: newCount,
    }));

    setShowRepostMenu(false);
    if (newReposted) {
      triggerToast('Reposted to your profile');
    }
    if (onRepostChange) onRepostChange(newReposted, newCount);
  };

  const handleBookmark = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const newBookmarked = !interactions.isBookmarked;
    const newCount = interactions.bookmarks + (newBookmarked ? 1 : -1);

    setInteractions((prev) => ({
      ...prev,
      isBookmarked: newBookmarked,
      bookmarks: newCount,
    }));

    if (newBookmarked) {
      handleParticleBurst('bookmark', e);
      triggerToast('Added to your Bookmarks');
    } else {
      triggerToast('Removed from Bookmarks');
    }

    if (onBookmarkChange) onBookmarkChange(newBookmarked, newCount);
  };

  const handleReply = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleParticleBurst('reply', e);
    if (onReplyClick) onReplyClick();
  };

  const handleShare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleParticleBurst('share', e);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      triggerToast('Link copied to clipboard');
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
    return count > 0 ? count.toLocaleString() : '';
  };

  return (
    <div className="relative w-full pt-1">
      <ParticleSystem particles={particles} type="like" />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1d9bf0] text-white px-4 py-2 rounded-full font-medium text-sm shadow-xl flex items-center gap-2 z-50 pointer-events-none"
          >
            <Check className="w-4 h-4" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between text-[#71767b] text-[13px] select-none max-w-md">
        {/* Reply */}
        <button
          onClick={handleReply}
          className="group flex items-center gap-1.5 transition-colors hover:text-[#1d9bf0]"
          title="Reply"
        >
          <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors flex items-center justify-center">
            <MessageCircle className="w-[18px] h-[18px] group-active:scale-90 transition-transform" />
          </div>
          <span>{formatCount(interactions.replies)}</span>
        </button>

        {/* Repost Button & Menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowRepostMenu(!showRepostMenu);
            }}
            className={`group flex items-center gap-1.5 transition-colors ${
              interactions.isReposted ? 'text-[#00ba7c]' : 'hover:text-[#00ba7c]'
            }`}
            title="Repost"
          >
            <div className="p-2 rounded-full group-hover:bg-[#00ba7c]/10 transition-colors flex items-center justify-center">
              <motion.div animate={{ rotate: interactions.isReposted ? 180 : 0 }}>
                <Repeat2 className="w-[18px] h-[18px] group-active:scale-90 transition-transform" />
              </motion.div>
            </div>
            <span>{formatCount(interactions.reposts)}</span>
          </button>

          <AnimatePresence>
            {showRepostMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowRepostMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 5 }}
                  className="absolute bottom-10 left-0 bg-[#000000] border border-[#2f3336] shadow-[0_8px_30px_rgb(0,0,0,0.5)] rounded-2xl p-1.5 z-40 min-w-[150px]"
                >
                  <button
                    onClick={handleRepostToggle}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#16181c] rounded-xl text-left font-bold text-sm text-[#e7e9ea] transition-colors"
                  >
                    <Repeat2 className="w-4 h-4 text-[#00ba7c]" />
                    <span>{interactions.isReposted ? 'Undo Repost' : 'Repost'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRepostMenu(false);
                      if (onQuoteClick) onQuoteClick();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#16181c] rounded-xl text-left font-bold text-sm text-[#e7e9ea] transition-colors"
                  >
                    <Quote className="w-4 h-4 text-[#1d9bf0]" />
                    <span>Quote</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Like */}
        <button
          onClick={handleLike}
          className={`group flex items-center gap-1.5 transition-colors ${
            interactions.isLiked ? 'text-[#f91880]' : 'hover:text-[#f91880]'
          }`}
          title="Like"
        >
          <div className="p-2 rounded-full group-hover:bg-[#f91880]/10 transition-colors flex items-center justify-center">
            <motion.div
              animate={{
                scale: interactions.isLiked ? [1, 1.4, 1] : 1,
              }}
              transition={{ duration: 0.35, ease: 'backOut' }}
            >
              <Heart
                className={`w-[18px] h-[18px] transition-all ${
                  interactions.isLiked ? 'fill-[#f91880] text-[#f91880]' : 'group-active:scale-90'
                }`}
              />
            </motion.div>
          </div>
          <motion.span key={interactions.likes} animate={{ scale: [1, 1.2, 1] }}>
            {formatCount(interactions.likes)}
          </motion.span>
        </button>

        {/* Views */}
        <div className="flex items-center gap-1.5 text-[#71767b]" title="Views">
          <div className="p-2 rounded-full flex items-center justify-center">
            <BarChart3 className="w-[18px] h-[18px]" />
          </div>
          <span>{formatCount(interactions.views)}</span>
        </div>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={`group flex items-center gap-1.5 transition-colors ${
            interactions.isBookmarked ? 'text-[#ffd700]' : 'hover:text-[#1d9bf0]'
          }`}
          title="Bookmark"
        >
          <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors flex items-center justify-center">
            <motion.div animate={{ scale: interactions.isBookmarked ? [1, 1.3, 1] : 1 }}>
              <Bookmark
                className={`w-[18px] h-[18px] ${
                  interactions.isBookmarked ? 'fill-[#ffd700] text-[#ffd700]' : ''
                }`}
              />
            </motion.div>
          </div>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="group flex items-center gap-1.5 transition-colors hover:text-[#1d9bf0]"
          title="Share"
        >
          <div className="p-2 rounded-full group-hover:bg-[#1d9bf0]/10 transition-colors flex items-center justify-center">
            <Share className="w-[18px] h-[18px] group-active:scale-90 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
};
