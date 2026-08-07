export type VerifiedType = 'blue' | 'gold' | 'gray' | 'none';

export interface Author {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified?: VerifiedType;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'gif';
  url: string;
  thumbnail?: string;
  aspectRatio?: string;
  alt?: string;
  duration?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollData {
  id: string;
  options: PollOption[];
  totalVotes: number;
  userVotedOptionId?: string;
  expiresAt?: string;
  isClosed?: boolean;
}

export interface QuotePostData {
  id: string;
  author: Author;
  createdAt: string;
  text: string;
  media?: MediaItem[];
}

export interface PostInteractions {
  replies: number;
  reposts: number;
  likes: number;
  views: number;
  bookmarks: number;
  isLiked?: boolean;
  isReposted?: boolean;
  isBookmarked?: boolean;
}

export interface XPostItem {
  id: string;
  author: Author;
  createdAt: string;
  text: string;
  media?: MediaItem[];
  poll?: PollData;
  quotePost?: QuotePostData;
  interactions: PostInteractions;
  replyToUsername?: string;
  replyToName?: string;
  replyToPostId?: string;
  replies?: XPostItem[];
  threadLevel?: number;
}
