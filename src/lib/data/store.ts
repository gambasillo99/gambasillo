import type {
  User,
  PostWithAuthor,
  CommentWithAuthor,
  MediaItem,
  ReactionEmoji,
  UpdateProfileInput,
  Notification,
  FeedMode,
} from "@/types";
import { apiClient } from "@/lib/api/client";
import { isRemoteBackend } from "@/lib/config";
import * as local from "./local-store";

export async function getUserById(id: string): Promise<User | null> {
  if (isRemoteBackend()) {
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
  if (isRemoteBackend()) {
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
  if (isRemoteBackend()) {
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
  if (isRemoteBackend()) {
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
  currentUserId?: string,
  mode: FeedMode = "foryou"
): Promise<PostWithAuthor[]> {
  if (isRemoteBackend()) {
    const { posts } = await apiClient.posts.feed(page, pageSize, mode);
    return posts;
  }
  return local.getFeedPosts(page, pageSize, currentUserId, mode);
}

export async function getUserPosts(
  userId: string,
  page: number,
  pageSize: number,
  currentUserId?: string
): Promise<PostWithAuthor[]> {
  if (isRemoteBackend()) {
    const { posts } = await apiClient.posts.byUser(userId, page, pageSize);
    return posts;
  }
  return local.getUserPosts(userId, page, pageSize, currentUserId);
}

export async function getPostById(
  id: string,
  currentUserId?: string
): Promise<PostWithAuthor | null> {
  if (isRemoteBackend()) {
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
  media: MediaItem[] = [],
  pollOptions?: string[]
): Promise<PostWithAuthor> {
  if (isRemoteBackend()) {
    const { post } = await apiClient.posts.create(content, media, pollOptions);
    return post;
  }
  return local.createPost(userId, content, media, pollOptions);
}

export async function updatePost(
  postId: string,
  userId: string,
  content: string,
  media?: MediaItem[]
): Promise<PostWithAuthor | null> {
  if (isRemoteBackend()) {
    const { post } = await apiClient.posts.update(postId, content, media);
    return post;
  }
  return local.updatePost(postId, userId, content, media);
}

export async function toggleLike(
  postId: string,
  userId: string
): Promise<PostWithAuthor | null> {
  if (isRemoteBackend()) {
    const { post } = await apiClient.posts.like(postId);
    return post;
  }
  return local.toggleLike(postId, userId);
}

export async function toggleRepost(
  postId: string,
  userId: string
): Promise<PostWithAuthor | null> {
  if (isRemoteBackend()) {
    const { post } = await apiClient.posts.repost(postId);
    return post;
  }
  return local.toggleRepost(postId, userId);
}

export async function toggleReaction(
  postId: string,
  userId: string,
  emoji: ReactionEmoji
): Promise<PostWithAuthor | null> {
  if (isRemoteBackend()) {
    const { post } = await apiClient.posts.react(postId, emoji);
    return post;
  }
  return local.toggleReaction(postId, userId, emoji);
}

export async function votePoll(
  postId: string,
  userId: string,
  optionId: string
): Promise<PostWithAuthor | null> {
  if (isRemoteBackend()) {
    const { post } = await apiClient.posts.votePoll(postId, optionId);
    return post;
  }
  return local.votePoll(postId, userId, optionId);
}

export async function togglePin(
  postId: string,
  userId: string
): Promise<PostWithAuthor | null> {
  if (isRemoteBackend()) {
    const { post } = await apiClient.posts.pin(postId);
    return post;
  }
  return local.togglePin(postId, userId);
}

export async function getPostComments(
  postId: string,
  currentUserId?: string
): Promise<CommentWithAuthor[]> {
  if (isRemoteBackend()) {
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
  if (isRemoteBackend()) {
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
  if (isRemoteBackend()) {
    return apiClient.users.follow(followingId);
  }
  return local.toggleFollow(followerId, followingId);
}

export async function isFollowing(
  followerId: string,
  followingId: string
): Promise<boolean> {
  if (isRemoteBackend()) {
    const { following } = await apiClient.users.isFollowing(followingId);
    return following;
  }
  return local.isFollowing(followerId, followingId);
}

export async function getActiveMembers(): Promise<User[]> {
  if (isRemoteBackend()) {
    const { users } = await apiClient.users.active();
    return users;
  }
  return local.getActiveMembers();
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<User | null> {
  if (isRemoteBackend()) {
    const { user } = await apiClient.users.updateProfile(input);
    return user;
  }
  return local.updateProfile(userId, input);
}

export async function sendPresence(userId: string): Promise<void> {
  if (isRemoteBackend()) {
    await apiClient.users.presence().catch(() => {});
    return;
  }
  local.updateLastSeen(userId);
}

export async function getNotifications(
  userId: string
): Promise<{ notifications: Notification[]; unreadCount: number }> {
  if (isRemoteBackend()) {
    return apiClient.notifications.list();
  }
  return local.getNotifications(userId);
}

export async function markNotificationsRead(userId: string): Promise<void> {
  if (isRemoteBackend()) {
    await apiClient.notifications.markRead();
    return;
  }
  local.markNotificationsRead(userId);
}
