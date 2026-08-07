'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Smile, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { XPostItem, Author } from '../types/xPost';
import { XPostCard } from './XPostCard';

interface XThreadProps {
  mainPost: XPostItem;
  currentUser?: Author;
  onPostClick?: (post: XPostItem) => void;
}

const DEFAULT_CURRENT_USER: Author = {
  id: 'current-user',
  name: 'Alex Rivera',
  username: 'arivera',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  verified: 'blue',
};

export const XThread: React.FC<XThreadProps> = ({
  mainPost: initialMainPost,
  currentUser = DEFAULT_CURRENT_USER,
  onPostClick,
}) => {
  const [mainPost, setMainPost] = useState<XPostItem>(initialMainPost);
  const [activeReplyPost, setActiveReplyPost] = useState<XPostItem | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeReplyPost) return;

    const newReply: XPostItem = {
      id: `reply-${Date.now()}`,
      author: currentUser,
      createdAt: 'Just now',
      text: replyText,
      replyToUsername: activeReplyPost.author.username,
      interactions: {
        replies: 0,
        reposts: 0,
        likes: 0,
        views: 1,
        bookmarks: 0,
        isLiked: false,
      },
    };

    setMainPost((prev) => ({
      ...prev,
      interactions: {
        ...prev.interactions,
        replies: prev.interactions.replies + 1,
      },
      replies: [newReply, ...(prev.replies || [])],
    }));

    setReplyText('');
    setActiveReplyPost(null);
  };

  const replies = mainPost.replies || [];
  const visibleReplies = isExpanded ? replies : replies.slice(0, 2);

  return (
    <div className="w-full bg-[#000000] border-x border-[#2f3336] max-w-2xl mx-auto overflow-hidden">
      {/* Main Thread Leader Post */}
      <XPostCard
        post={mainPost}
        hasBottomThreadLine={replies.length > 0}
        onPostClick={onPostClick}
        onReplyClick={(p) => setActiveReplyPost(p)}
        onQuoteClick={(p) => alert(`Quote post: ${p.id}`)}
      />

      {/* Replies Container with Thread Line */}
      <div className="relative">
        <AnimatePresence initial={false}>
          {visibleReplies.map((reply, index) => {
            const isLast = index === visibleReplies.length - 1;
            return (
              <motion.div
                key={reply.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <XPostCard
                  post={reply}
                  hasTopThreadLine={true}
                  hasBottomThreadLine={!isLast}
                  onPostClick={onPostClick}
                  onReplyClick={(p) => setActiveReplyPost(p)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show More / Show Less Replies Button */}
      {replies.length > 2 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 px-4 border-b border-[#2f3336] text-[#1d9bf0] hover:bg-[#16181c]/60 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          {isExpanded ? (
            <>
              <span>Collapse thread</span>
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Show {replies.length - 2} more replies</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}

      {/* Quick Reply Inline Composer Modal */}
      <AnimatePresence>
        {activeReplyPost && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-4 bg-[#16181c] border-t border-[#2f3336]"
          >
            <div className="text-xs text-[#71767b] mb-2 flex items-center justify-between">
              <span>
                Replying to <span className="text-[#1d9bf0]">@{activeReplyPost.author.username}</span>
              </span>
              <button
                onClick={() => setActiveReplyPost(null)}
                className="text-[#71767b] hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleSendReply} className="flex gap-3 items-start">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover mt-1"
              />
              <div className="flex-1">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Post your reply"
                  rows={2}
                  className="w-full bg-transparent text-[#e7e9ea] placeholder-[#71767b] outline-none resize-none text-sm"
                  autoFocus
                />
                <div className="flex items-center justify-between pt-2 border-t border-[#2f3336]/60">
                  <div className="flex items-center gap-2 text-[#1d9bf0]">
                    <button type="button" className="p-1.5 hover:bg-[#1d9bf0]/10 rounded-full">
                      <Image className="w-4 h-4" />
                    </button>
                    <button type="button" className="p-1.5 hover:bg-[#1d9bf0]/10 rounded-full">
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="bg-[#1d9bf0] hover:bg-[#1a8cd8] disabled:opacity-50 text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
                  >
                    <span>Reply</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
