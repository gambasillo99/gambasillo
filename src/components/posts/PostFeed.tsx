"use client";

import { useEffect } from "react";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";
import { PostSkeleton } from "@/components/ui/Skeleton";
import { useFeedPosts } from "@/hooks/usePosts";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useAuth } from "@/lib/auth/context";
import type { MediaItem } from "@/types";

interface PostFeedProps {
  userId?: string;
  showComposer?: boolean;
}

export function PostFeed({ userId, showComposer = true }: PostFeedProps) {
  const { user } = useAuth();
  const {
    posts,
    loading,
    hasMore,
    initialized,
    loadMore,
    addPost,
    likePost,
    repostPost,
  } = useFeedPosts(userId, user?.id);

  const sentinelRef = useInfiniteScroll(
    () => {
      void loadMore();
    },
    hasMore,
    loading
  );

  useEffect(() => {
    if (!initialized) void loadMore();
  }, [initialized, loadMore]);

  const handlePost = async (content: string, media: MediaItem[]) => {
    await addPost(content, media);
  };

  return (
    <div>
      {showComposer && !userId && <PostComposer onPost={handlePost} />}
      {!initialized && (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      )}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={(id) => void likePost(id)}
          onRepost={(id) => void repostPost(id)}
        />
      ))}
      {loading && initialized && (
        <div className="py-4">
          <PostSkeleton />
        </div>
      )}
      <div ref={sentinelRef} className="h-4" />
      {initialized && !hasMore && posts.length > 0 && (
        <p className="text-center text-gambas-muted text-sm py-8">
          🦐 Has llegado al final del gambasillo
        </p>
      )}
      {initialized && posts.length === 0 && (
        <p className="text-center text-gambas-muted py-12">
          Aún no hay posts. ¡Sé el primero en publicar!
        </p>
      )}
    </div>
  );
}
