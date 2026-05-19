"use client";

import { useCallback, useState } from "react";
import type { FeedMode, PostWithAuthor, MediaItem, ReactionEmoji } from "@/types";
import {
  getFeedPosts,
  getUserPosts,
  createPost,
  updatePost,
  toggleLike,
  toggleRepost,
  toggleReaction,
  votePoll,
  togglePin,
} from "@/lib/data/store";

const PAGE_SIZE = 10;

export function useFeedPosts(
  profileUserId?: string,
  currentUserId?: string,
  feedMode: FeedMode = "foryou"
) {
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
        : await getFeedPosts(page, PAGE_SIZE, currentUserId, feedMode);

      setPosts((prev) => (page === 0 ? newPosts : [...prev, ...newPosts]));
      setHasMore(newPosts.length === PAGE_SIZE);
      setPage((p) => p + 1);
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [loading, hasMore, page, profileUserId, currentUserId, feedMode]);

  const refresh = useCallback(() => {
    setPosts([]);
    setPage(0);
    setHasMore(true);
    setInitialized(false);
  }, []);

  const addPost = useCallback(
    async (content: string, media: MediaItem[] = [], pollOptions?: string[]) => {
      if (!currentUserId) return;
      const post = await createPost(currentUserId, content, media, pollOptions);
      setPosts((prev) => [post, ...prev]);
    },
    [currentUserId]
  );

  const patchPost = useCallback((updated: PostWithAuthor) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }, []);

  const likePost = useCallback(
    async (postId: string) => {
      if (!currentUserId) return;
      const updated = await toggleLike(postId, currentUserId);
      if (updated) patchPost(updated);
    },
    [currentUserId, patchPost]
  );

  const repostPost = useCallback(
    async (postId: string) => {
      if (!currentUserId) return;
      const updated = await toggleRepost(postId, currentUserId);
      if (updated) patchPost(updated);
    },
    [currentUserId, patchPost]
  );

  const reactPost = useCallback(
    async (postId: string, emoji: ReactionEmoji) => {
      if (!currentUserId) return;
      const updated = await toggleReaction(postId, currentUserId, emoji);
      if (updated) patchPost(updated);
    },
    [currentUserId, patchPost]
  );

  const votePostPoll = useCallback(
    async (postId: string, optionId: string) => {
      if (!currentUserId) return;
      const updated = await votePoll(postId, currentUserId, optionId);
      if (updated) patchPost(updated);
    },
    [currentUserId, patchPost]
  );

  const editPost = useCallback(
    async (postId: string, content: string) => {
      if (!currentUserId) return;
      const updated = await updatePost(postId, currentUserId, content);
      if (updated) patchPost(updated);
    },
    [currentUserId, patchPost]
  );

  const pinPost = useCallback(
    async (postId: string) => {
      if (!currentUserId) return;
      const updated = await togglePin(postId, currentUserId);
      if (updated) patchPost(updated);
    },
    [currentUserId, patchPost]
  );

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
    reactPost,
    votePostPoll,
    editPost,
    pinPost,
    updatePost: patchPost,
  };
}
