import type { User, Post, MediaItem, Comment } from "@/types";
import type { Database } from "./types";

type DbUser = Database["public"]["Tables"]["users"]["Row"];
type DbPost = Database["public"]["Tables"]["posts"]["Row"];
type DbComment = Database["public"]["Tables"]["comments"]["Row"];

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

export function mapPost(row: DbPost): Post {
  const media = (Array.isArray(row.media) ? row.media : []) as MediaItem[];
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
