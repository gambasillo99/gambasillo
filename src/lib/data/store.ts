import type {
  User,
  PostWithAuthor,
  CommentWithAuthor,
  MediaItem,
} from "@/types";
import { apiClient } from "@/lib/api/client";
import * as local from "./local-store";

function useApi(): boolean {
  return Boolean(
    typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL
  );
}

export async function seedDatabaseIfNeeded(): Promise<void> {
  if (useApi()) {
    await apiClient.seed();
    return;
  }
  return local.seedDatabaseIfNeeded();
}

export async function getUserById(id: string): Promise<User | null> {
  if (useApi()) {
    try {
      const { user } = await apiClient.auth.me();
      if (user?.id === id) return user;
    } catch {
      /* fall through */
    }
    return null;
  }
  return local.getUserById(id);
}

export async function getUserByUsername(
  username: string
): Promise<User | null> {
  if (useApi()) {
    try {
      const { user } = await apiClient.users.get(username);
      return user;
    } catch {
      return null;
    }
  }
  return local.getUserByUsername(username);
}

export async function registerUser(
  username: string,
  password: string,
  displayName?: string
): Promise<{ user: User } | { error: string }> {
  if (useApi()) {
    try {
      const { user } = await apiClient.auth.register({
        username,
        password,
        displayName,
      });
      return { user };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Error al registrar" };
    }
  }
  return local.registerUser(username, password, displayName);
}

export async function loginUser(
  username: string,
  password: string
): Promise<{ user: User } | { error: string }> {
  if (useApi()) {
    try {
      const { user } = await apiClient.auth.login({ username, password });
      return { user };
    } catch (e) {
      return { error: e instanceof Error ? e.message : "Error al iniciar sesión" };
    }
  }
  return local.loginUser(username, password);
}

export async function getFeedPosts(
  page: number,
  pageSize: number,
  currentUserId?: string
): Promise<PostWithAuthor[]> {
  if (useApi()) {
    const { posts } = await apiClient.posts.feed(page, pageSize);
    return posts;
  }
  return local.getFeedPosts(page, pageSize, currentUserId);
}

export async function getUserPosts(
  userId: string,
  page: number,
  pageSize: number,
  currentUserId?: string
): Promise<PostWithAuthor[]> {
  if (useApi()) {
    const { posts } = await apiClient.posts.byUser(userId, page, pageSize);
    return posts;
  }
  return local.getUserPosts(userId, page, pageSize, currentUserId);
}

export async function getPostById(
  id: string,
  currentUserId?: string
): Promise<PostWithAuthor | null> {
  if (useApi()) {
    try {
      const { post } = await apiClient.posts.get(id);
      return post;
    } catch {
      return null;
    }
  }
  return local.getPostById(id, currentUserId);
}

export async function createPost(
  userId: string,
  content: string,
  media: MediaItem[] = []
): Promise<PostWithAuthor> {
  if (useApi()) {
    const { post } = await apiClient.posts.create(content, media);
    return post;
  }
  return local.createPost(userId, content, media);
}

export async function toggleLike(
  postId: string,
  userId: string
): Promise<PostWithAuthor | null> {
  if (useApi()) {
    const { post } = await apiClient.posts.like(postId);
    return post;
  }
  return local.toggleLike(postId, userId);
}

export async function toggleRepost(
  postId: string,
  userId: string
): Promise<PostWithAuthor | null> {
  if (useApi()) {
    const { post } = await apiClient.posts.repost(postId);
    return post;
  }
  return local.toggleRepost(postId, userId);
}

export async function getPostComments(
  postId: string,
  currentUserId?: string
): Promise<CommentWithAuthor[]> {
  if (useApi()) {
    const { comments } = await apiClient.comments.list(postId);
    return comments;
  }
  return local.getPostComments(postId, currentUserId);
}

export async function addComment(
  postId: string,
  userId: string,
  content: string,
  parentId: string | null = null
): Promise<CommentWithAuthor | null> {
  if (useApi()) {
    const { comment } = await apiClient.comments.create(
      postId,
      content,
      parentId
    );
    return comment;
  }
  return local.addComment(postId, userId, content, parentId);
}

export async function toggleFollow(
  followerId: string,
  followingId: string
): Promise<{ following: boolean; followersCount: number } | null> {
  if (useApi()) {
    return apiClient.users.follow(followingId);
  }
  return local.toggleFollow(followerId, followingId);
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (useApi()) {
    const { following } = await apiClient.users.isFollowing(followingId);
    return following;
  }
  return local.isFollowing(followerId, followingId);
}

export async function getActiveMembers(): Promise<User[]> {
  if (useApi()) {
    const { users } = await apiClient.users.active();
    return users;
  }
  return local.getActiveMembers();
}
