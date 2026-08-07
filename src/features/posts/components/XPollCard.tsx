'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { PollData } from '../types/xPost';

interface XPollCardProps {
  poll: PollData;
  onVote?: (optionId: string) => void;
}

export const XPollCard: React.FC<XPollCardProps> = ({ poll: initialPoll, onVote }) => {
  const [poll, setPoll] = useState(initialPoll);
  const [selectedOptionId, setSelectedOptionId] = useState<string | undefined>(
    initialPoll.userVotedOptionId
  );

  const hasVoted = Boolean(selectedOptionId || poll.isClosed);

  const handleVote = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasVoted) return;

    const newOptions = poll.options.map((opt) =>
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    const newTotal = poll.totalVotes + 1;
    setSelectedOptionId(optionId);
    setPoll({
      ...poll,
      options: newOptions,
      totalVotes: newTotal,
      userVotedOptionId: optionId,
    });

    if (onVote) onVote(optionId);
  };

  // Find max vote option for winning highlight
  const maxVotes = Math.max(...poll.options.map((o) => o.votes));

  return (
    <div className="mt-3 w-full max-w-lg select-none space-y-2">
      {poll.options.map((option) => {
        const percentage =
          poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
        const isSelected = selectedOptionId === option.id;
        const isWinner = hasVoted && option.votes === maxVotes && maxVotes > 0;

        return (
          <div
            key={option.id}
            onClick={(e) => handleVote(option.id, e)}
            className={`relative overflow-hidden rounded-xl border transition-all ${
              hasVoted
                ? 'border-transparent bg-[#16181c] cursor-default'
                : 'border-[#2f3336] bg-[#000000] hover:bg-[#16181c] cursor-pointer'
            }`}
          >
            {/* Animated Fill Bar after Vote */}
            {hasVoted && (
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`absolute inset-y-0 left-0 ${
                  isWinner ? 'bg-[#1d9bf0]/30' : 'bg-[#71767b]/20'
                }`}
              />
            )}

            {/* Poll Content Layout */}
            <div className="relative z-10 flex items-center justify-between px-4 py-3 text-sm">
              <div className="flex items-center gap-2.5 font-medium">
                {hasVoted && isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-[#1d9bf0] shrink-0" />
                )}
                <span className={isWinner ? 'font-bold text-[#e7e9ea]' : 'text-[#e7e9ea]'}>
                  {option.text}
                </span>
              </div>

              {hasVoted && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`font-bold text-sm ${
                    isWinner ? 'text-[#1d9bf0]' : 'text-[#71767b]'
                  }`}
                >
                  {percentage}%
                </motion.span>
              )}
            </div>
          </div>
        );
      })}

      <div className="text-xs text-[#71767b] pt-1 flex items-center gap-2">
        <span>{poll.totalVotes.toLocaleString()} votes</span>
        <span>•</span>
        <span>{poll.isClosed ? 'Final results' : poll.expiresAt || '12 hours left'}</span>
      </div>
    </div>
  );
};
