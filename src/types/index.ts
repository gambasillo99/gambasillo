export interface ProfileLink {
  label: string;
  url: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  links: ProfileLink[];
  followersCount: number;
  followingCount: number;
  createdAt: string;
  lastSeenAt?: string | null;
  isOnline?: boolean;
}

export type MediaType = "image" | "video" | "audio";

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
}

export type ReactionEmoji = "fire" | "laugh" | "skull" | "heart";

export const REACTION_EMOJIS: { key: ReactionEmoji; char: string }[] = [
  { key: "fire", char: "🔥" },
  { key: "laugh", char: "😂" },
  { key: "skull", char: "💀" },
  { key: "heart", char: "❤️" },
];

export interface ReactionCounts {
  fire: number;
  laugh: number;
  skull: number;
  heart: number;
}

export const EMPTY_REACTIONS: ReactionCounts = {
  fire: 0,
  laugh: 0,
  skull: 0,
  heart: 0,
};

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  options: PollOption[];
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  media: MediaItem[];
  likesCount: number;
  repostsCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt?: string | null;
  isPinned: boolean;
  pinnedAt?: string | null;
  poll?: Poll | null;
  reactions: ReactionCounts;
  likedByMe?: boolean;
  repostedByMe?: boolean;
  myReaction?: ReactionEmoji | null;
  myPollVoteOptionId?: string | null;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  replies?: Comment[];
}

export interface Like {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface Repost {
  id: string;
  userId: string;
  postId: string;
  createdAt: string;
}

export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface PostWithAuthor extends Post {
  author: User;
}

export interface CommentWithAuthor extends Omit<Comment, "replies"> {
  author: User;
  replies?: CommentWithAuthor[];
}

export type NotificationType =
  | "follow"
  | "like"
  | "comment"
  | "reaction"
  | "mention";

export interface Notification {
  id: string;
  userId: string;
  actorId: string;
  type: NotificationType;
  postId?: string | null;
  commentId?: string | null;
  emoji?: string | null;
  readAt?: string | null;
  createdAt: string;
  actor?: User;
}

export interface AuthUser {
  id: string;
  username: string;
}

export interface RegisterInput {
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export type FeedMode = "following" | "foryou" | "all";

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  links?: ProfileLink[];
}

export interface CreatePollInput {
  options: string[];
}
