"use client";

import { useEffect } from "react";
import { PostCard } from "./PostCard";
import { PostComposer } from "./PostComposer";
import { PostSkeleton } from "@/components/ui/Skeleton";
import { useFeedPosts } from "@/hooks/usePosts";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useAuth } from "@/lib/auth/context";
import type { FeedMode, MediaItem } from "@/types";
import { copy } from "@/lib/gambas-copy";

interface PostFeedProps {
  userId?: string;
  showComposer?: boolean;
  feedMode?: FeedMode;
}

export function PostFeed({
  userId,
  showComposer = true,
  feedMode = "foryou",
}: PostFeedProps) {
  const { user } = useAuth();
  const {
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
    removePost,
  } = useFeedPosts(userId, user?.id, feedMode);

  const sentinelRef = useInfiniteScroll(
    () => {
      void loadMore();
    },
    hasMore,
    loading
  );

  useEffect(() => {
    refresh();
  }, [feedMode, userId, refresh]);

  useEffect(() => {
    if (!initialized) void loadMore();
  }, [initialized, loadMore]);

  const handlePost = async (
    content: string,
    media: MediaItem[],
    pollOptions?: string[]
  ) => {
    await addPost(content, media, pollOptions);
  };

  return (
    <div>
      {showComposer && !userId && (
        <PostComposer onPost={handlePost} />
      )}
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
          currentUserId={user?.id}
          onLike={(id) => void likePost(id)}
          onRepost={(id) => void repostPost(id)}
          onReact={(id, emoji) => void reactPost(id, emoji)}
          onVotePoll={(id, opt) => void votePostPoll(id, opt)}
          onEdit={(id, content) => void editPost(id, content)}
          onPin={
            userId && user?.id === userId
              ? (id) => void pinPost(id)
              : undefined
          }
          onDelete={(id) => void removePost(id)}
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
          {copy.feedEnd}
        </p>
      )}
      {initialized && posts.length === 0 && (
        <p className="text-center text-gambas-muted py-12">{copy.feedEmpty}</p>
      )}
    </div>
  );
}
