import type { User, Post, MediaItem, Comment } from "@/types";
import type { Database, Json } from "./types";

type DbUser = Database["public"]["Tables"]["users"]["Row"];
type DbPost = Database["public"]["Tables"]["posts"]["Row"];
type DbComment = Database["public"]["Tables"]["comments"]["Row"];

/** Guarda multimedia en columna jsonb de Supabase */
export function serializeMedia(media: MediaItem[]): Json {
  return JSON.parse(JSON.stringify(media)) as Json;
}

export function mapUser(row: DbUser): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    followersCount: row.followers_count,
    followingCount: row.following_count,
    createdAt: row.created_at,
  };
}

export function parseMedia(value: Json | null | undefined): MediaItem[] {
  if (!value || !Array.isArray(value)) return [];
  return value as unknown as MediaItem[];
}

export function mapPost(row: DbPost): Post {
  const media = parseMedia(row.media);
  return {
    id: row.id,
    userId: row.user_id,
    content: row.content,
    media,
    likesCount: row.likes_count,
    repostsCount: row.reposts_count,
    commentsCount: row.comments_count,
    createdAt: row.created_at,
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
