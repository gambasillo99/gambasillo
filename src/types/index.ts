export interface User {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

export type MediaType = "image" | "video" | "audio";

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
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
  likedByMe?: boolean;
  repostedByMe?: boolean;
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

export interface CommentWithAuthor extends Comment {
  author: User;
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
