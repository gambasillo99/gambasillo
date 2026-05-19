"use client";

import { useCallback, useState } from "react";
import type { PostWithAuthor, MediaItem } from "@/types";
import {
  getFeedPosts,
  getUserPosts,
  createPost,
  toggleLike,
  toggleRepost,
} from "@/lib/data/store";

const PAGE_SIZE = 10;

export function useFeedPosts(profileUserId?: string, currentUserId?: string) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const newPosts = profileUserId
        ? await getUserPosts(profileUserId, page, PAGE_SIZE, currentUserId)
        : await getFeedPosts(page, PAGE_SIZE, currentUserId);

      setPosts((prev) => (page === 0 ? newPosts : [...prev, ...newPosts]));
      setHasMore(newPosts.length === PAGE_SIZE);
      setPage((p) => p + 1);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [loading, hasMore, page, profileUserId, currentUserId]);

  const refresh = useCallback(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    setInitialized(false);
  }, []);

  const addPost = useCallback(
    async (content: string, media: MediaItem[] = []) => {
      if (!currentUserId) return;
      const post = await createPost(currentUserId, content, media);
      setPosts((prev) => [post, ...prev]);
    },
    [currentUserId]
  );

  const likePost = useCallback(
    async (postId: string) => {
      if (!currentUserId) return;
      const updated = await toggleLike(postId, currentUserId);
      if (updated) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      }
    },
    [currentUserId]
  );

  const repostPost = useCallback(
    async (postId: string) => {
      if (!currentUserId) return;
      const updated = await toggleRepost(postId, currentUserId);
      if (updated) {
        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
      }
    },
    [currentUserId]
  );

  const updatePost = useCallback((updated: PostWithAuthor) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  return {
    posts,
    loading,
    hasMore,
    initialized,
    loadMore,
    refresh,
    addPost,
    likePost,
    repostPost,
    updatePost,
  };
}
