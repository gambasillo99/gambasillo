import type {
  User,
  Post,
  MediaItem,
  Comment,
  ReactionCounts,
  ReactionEmoji,
} from "@/types";
import { EMPTY_REACTIONS } from "@/types";
import type { Database, Json } from "./types";
import { parseLinks, parsePoll } from "./social-mappers";
import { isUserOnline } from "@/lib/presence";

type DbUser = Database["public"]["Tables"]["users"]["Row"] & {
  banner_url?: string;
  links?: Json;
  last_seen_at?: string | null;
};

type DbPost = Database["public"]["Tables"]["posts"]["Row"] & {
  updated_at?: string | null;
  is_pinned?: boolean;
  pinned_at?: string | null;
  poll?: Json | null;
};

type DbComment = Database["public"]["Tables"]["comments"]["Row"];

export function serializeMedia(media: MediaItem[]): Json {
  return JSON.parse(JSON.stringify(media)) as Json;
}

export function mapUser(row: DbUser): User {
  const lastSeenAt = row.last_seen_at ?? null;
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    bannerUrl: row.banner_url ?? "",
    links: parseLinks(row.links),
    followersCount: row.followers_count,
    followingCount: row.following_count,
    createdAt: row.created_at,
    lastSeenAt,
    isOnline: isUserOnline(lastSeenAt),
  };
}

export function parseMedia(value: Json | null | undefined): MediaItem[] {
  if (!value || !Array.isArray(value)) return [];
  return value as unknown as MediaItem[];
}

export function mapPost(
  row: DbPost,
  extras?: {
    reactions?: ReactionCounts;
    myReaction?: ReactionEmoji | null;
    poll?: ReturnType<typeof parsePoll>;
    myPollVoteOptionId?: string | null;
  }
): Post {
  const media = parseMedia(row.media);
  const voteCounts: Record<string, number> = {};
  extras?.poll?.options.forEach((o) => {
    voteCounts[o.id] = o.votes;
  });

  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    media,
    likesCount: row.likes_count,
    repostsCount: row.reposts_count,
    commentsCount: row.comments_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
    isPinned: row.is_pinned ?? false,
    pinnedAt: row.pinned_at ?? null,
    poll: extras?.poll ?? parsePoll(row.poll, voteCounts),
    reactions: extras?.reactions ?? { ...EMPTY_REACTIONS },
    myReaction: extras?.myReaction ?? null,
    myPollVoteOptionId: extras?.myPollVoteOptionId ?? null,
  };
}

export function mapComment(row: DbComment): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    parentId: row.parent_id,
    content: row.content,
    createdAt: row.created_at,
  };
}
