'use client';

import React from 'react';
import { QuotePostData } from '../types/xPost';
import { BadgeCheck } from 'lucide-react';

interface XQuotePostCardProps {
  quote: QuotePostData;
  onQuoteClick?: (quoteId: string) => void;
}

export const XQuotePostCard: React.FC<XQuotePostCardProps> = ({ quote, onQuoteClick }) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (onQuoteClick) onQuoteClick(quote.id);
      }}
      className="mt-3 rounded-2xl border border-[#2f3336] p-3 hover:bg-[#16181c]/50 transition-colors cursor-pointer select-none"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-1.5">
        <img
          src={quote.author.avatar}
          alt={quote.author.name}
          className="w-5 h-5 rounded-full object-cover"
        />
        <span className="font-bold text-[14px] text-[#e7e9ea] truncate">{quote.author.name}</span>
        {quote.author.verified === 'blue' && (
          <BadgeCheck className="w-4 h-4 text-[#1d9bf0] fill-[#1d9bf0]/20 shrink-0" />
        )}
        {quote.author.verified === 'gold' && (
          <BadgeCheck className="w-4 h-4 text-[#eab308] fill-[#eab308]/20 shrink-0" />
        )}
        <span className="text-[13px] text-[#71767b] truncate">@{quote.author.username}</span>
        <span className="text-[13px] text-[#71767b]">·</span>
        <span className="text-[13px] text-[#71767b] shrink-0">{quote.createdAt}</span>
      </div>

      {/* Quote Text */}
      <p className="text-[14px] text-[#e7e9ea] leading-snug whitespace-pre-wrap">{quote.text}</p>

      {/* Quote Media Thumbnail if present */}
      {quote.media && quote.media.length > 0 && (
        <div className="mt-2 rounded-xl overflow-hidden max-h-[200px]">
          <img
            src={quote.media[0].url}
            alt="Quote media"
            className="w-full h-full object-cover max-h-[200px]"
          />
        </div>
      )}
    </div>
  );
};
