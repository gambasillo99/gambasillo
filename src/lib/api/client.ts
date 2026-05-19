import type {
  User,
  PostWithAuthor,
  CommentWithAuthor,
  MediaItem,
  LoginInput,
  RegisterInput,
} from "@/types";

async function api<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error ?? "Error de servidor");
  }

  return json as T;
}

export const apiClient = {
  auth: {
    me: () => api<{ user: User | null }>("/api/auth/me"),
    login: (input: LoginInput) =>
      api<{ user: User }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    register: (input: RegisterInput) =>
      api<{ user: User }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    logout: () => api<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  },

  posts: {
    feed: (page: number, pageSize: number) =>
      api<{ posts: PostWithAuthor[] }>(
        `/api/posts?page=${page}&pageSize=${pageSize}`
      ),
    byUser: (userId: string, page: number, pageSize: number) =>
      api<{ posts: PostWithAuthor[] }>(
        `/api/posts?userId=${userId}&page=${page}&pageSize=${pageSize}`
      ),
    get: (id: string) => api<{ post: PostWithAuthor }>(`/api/posts/${id}`),
    create: (content: string, media: MediaItem[]) =>
      api<{ post: PostWithAuthor }>("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content, media }),
      }),
    like: (id: string) =>
      api<{ post: PostWithAuthor }>(`/api/posts/${id}/like`, {
        method: "POST",
      }),
    repost: (id: string) =>
      api<{ post: PostWithAuthor }>(`/api/posts/${id}/repost`, {
        method: "POST",
      }),
  },

  comments: {
    list: (postId: string) =>
      api<{ comments: CommentWithAuthor[] }>(
        `/api/comments?postId=${postId}`
      ),
    create: (postId: string, content: string, parentId?: string | null) =>
      api<{ comment: CommentWithAuthor }>("/api/comments", {
        method: "POST",
        body: JSON.stringify({ postId, content, parentId: parentId ?? null }),
      }),
  },

  users: {
    get: (username: string) =>
      api<{ user: User }>(`/api/users/${username}`),
    active: () => api<{ users: User[] }>("/api/users/active"),
    follow: (userId: string) =>
      api<{ following: boolean; followersCount: number }>(
        `/api/follow/${userId}`,
        { method: "POST" }
      ),
    isFollowing: (userId: string) =>
      api<{ following: boolean }>(`/api/follow/${userId}`),
  },

  upload: async (file: File, type: "image" | "video" | "audio") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Error al subir archivo");
    return json as {
      url: string;
      publicId: string;
      type: string;
      id: string;
    };
  },

  seed: () => api<{ ok: boolean }>("/api/seed", { method: "POST" }),
};
